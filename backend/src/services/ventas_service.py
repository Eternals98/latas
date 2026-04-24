from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from io import BytesIO
from typing import Iterable

from openpyxl import Workbook
from sqlalchemy import delete, select
from sqlalchemy.orm import Session, selectinload

from src.api.schemas.ventas import (
    CreateVentaRequest,
    ResumenMensualVentas,
    UpdateVentaRequest,
    VentasMensualesResponse,
    to_money,
    venta_to_report_item,
)
from src.models import Cliente, EstadoVentaEnum, Pago, TipoVentaEnum, Venta


class VentaValidationError(Exception):
    pass


class VentaNotFoundError(Exception):
    pass


class VentaConflictError(Exception):
    pass


def _parse_int(value: int | str | None, field_name: str) -> int:
    if value is None or value == "":
        raise VentaValidationError(f"{field_name} es requerido.")
    try:
        return int(value)
    except (TypeError, ValueError) as exc:
        raise VentaValidationError(f"{field_name} debe ser numerico.") from exc


def validate_period(mes: int | str | None, anio: int | str | None) -> tuple[int, int]:
    parsed_mes = _parse_int(mes, "mes")
    parsed_anio = _parse_int(anio, "anio")
    if parsed_mes < 1 or parsed_mes > 12:
        raise VentaValidationError("mes debe estar entre 1 y 12.")
    if parsed_anio < 2000 or parsed_anio > 9999:
        raise VentaValidationError("anio debe ser mayor o igual a 2000.")
    return parsed_mes, parsed_anio


def validate_export_period(mes: int | str | None, anio: int | str | None) -> tuple[int, int] | None:
    if (mes is None or mes == "") and (anio is None or anio == ""):
        return None
    if mes is None or mes == "" or anio is None or anio == "":
        raise VentaValidationError("Debe enviar mes y anio juntos para filtrar exportacion.")
    return validate_period(mes, anio)


def validate_tipo_export(tipo: str | None) -> str:
    if tipo is None or not tipo.strip():
        raise VentaValidationError("tipo es requerido.")
    cleaned = tipo.strip()
    allowed = {TipoVentaEnum.FORMAL.value, TipoVentaEnum.INFORMAL.value}
    if cleaned not in allowed:
        raise VentaValidationError("tipo debe ser formal o informal.")
    return cleaned


def month_range(mes: int, anio: int) -> tuple[datetime, datetime]:
    start = datetime(anio, mes, 1)
    if mes == 12:
        end = datetime(anio + 1, 1, 1)
    else:
        end = datetime(anio, mes + 1, 1)
    return start, end


def calculate_payment_total(payload: CreateVentaRequest) -> Decimal:
    return sum((to_money(pago.monto) for pago in payload.pagos), start=Decimal("0.00"))


def validate_total_equals_payments(payload: CreateVentaRequest) -> None:
    total = to_money(payload.valor_total)
    payments_total = calculate_payment_total(payload)
    if payments_total != total:
        raise VentaValidationError("La suma de pagos no coincide con valor_total.")


def validate_positive_payments(payload: CreateVentaRequest) -> None:
    for pago in payload.pagos:
        if to_money(pago.monto) <= 0:
            raise VentaValidationError("Cada pago debe tener monto positivo.")


def create_venta_with_pagos(db: Session, payload: CreateVentaRequest) -> Venta:
    if not payload.pagos:
        raise VentaValidationError("Debe enviar al menos un pago.")

    validate_positive_payments(payload)
    validate_total_equals_payments(payload)

    try:
        venta = Venta(
            empresa=payload.empresa,
            tipo=payload.tipo,
            numero_referencia=payload.numero_referencia,
            descripcion=payload.descripcion,
            valor_total=to_money(payload.valor_total),
            cliente_id=payload.cliente_id,
            estado=EstadoVentaEnum.ACTIVO.value,
        )
        db.add(venta)
        db.flush()

        for pago in payload.pagos:
            db.add(
                Pago(
                    venta_id=venta.id,
                    medio=pago.medio,
                    monto=to_money(pago.monto),
                )
            )

        db.commit()
    except Exception:
        db.rollback()
        raise

    return (
        db.execute(
            select(Venta)
            .options(selectinload(Venta.pagos))
            .where(Venta.id == venta.id)
        )
        .scalars()
        .one()
    )


def _get_venta_with_pagos(db: Session, venta_id: int) -> Venta:
    venta = (
        db.execute(
            select(Venta)
            .options(selectinload(Venta.pagos))
            .where(Venta.id == venta_id)
        )
        .scalars()
        .one_or_none()
    )
    if venta is None:
        raise VentaNotFoundError("Venta no encontrada.")
    return venta


def _validate_cliente_exists(db: Session, cliente_id: int | None) -> None:
    if cliente_id is None:
        return
    exists = db.execute(select(Cliente.id).where(Cliente.id == cliente_id)).scalar_one_or_none()
    if exists is None:
        raise VentaValidationError("cliente_id no corresponde a un cliente existente.")


def update_venta_with_pagos(db: Session, venta_id: int, payload: UpdateVentaRequest) -> Venta:
    validate_positive_payments(payload)
    validate_total_equals_payments(payload)
    _validate_cliente_exists(db, payload.cliente_id)

    try:
        venta = _get_venta_with_pagos(db, venta_id)
        if venta.estado != EstadoVentaEnum.ACTIVO.value:
            raise VentaConflictError("Solo se pueden editar ventas activas.")

        venta.empresa = payload.empresa
        venta.tipo = payload.tipo
        venta.numero_referencia = payload.numero_referencia
        venta.descripcion = payload.descripcion
        venta.valor_total = to_money(payload.valor_total)
        venta.cliente_id = payload.cliente_id

        db.execute(delete(Pago).where(Pago.venta_id == venta.id))
        db.flush()
        for pago in payload.pagos:
            db.add(Pago(venta_id=venta.id, medio=pago.medio, monto=to_money(pago.monto)))

        db.commit()
    except (VentaNotFoundError, VentaConflictError, VentaValidationError):
        db.rollback()
        raise
    except Exception:
        db.rollback()
        raise

    return _get_venta_with_pagos(db, venta_id)


def annul_venta(db: Session, venta_id: int) -> Venta:
    try:
        venta = _get_venta_with_pagos(db, venta_id)
        if venta.estado != EstadoVentaEnum.ANULADO.value:
            venta.estado = EstadoVentaEnum.ANULADO.value
            db.commit()
        else:
            db.commit()
    except VentaNotFoundError:
        db.rollback()
        raise
    except Exception:
        db.rollback()
        raise

    return _get_venta_with_pagos(db, venta_id)


def build_monthly_summary(
    ventas: Iterable[Venta],
    *,
    mes: int,
    anio: int,
) -> ResumenMensualVentas:
    ventas_list = list(ventas)
    total = sum((to_money(venta.valor_total) for venta in ventas_list), start=Decimal("0.00"))
    return ResumenMensualVentas(
        mes=mes,
        anio=anio,
        cantidad_ventas=len(ventas_list),
        valor_total=to_money(total),
    )


def list_ventas_by_month(db: Session, mes: int | str | None, anio: int | str | None) -> VentasMensualesResponse:
    parsed_mes, parsed_anio = validate_period(mes, anio)
    start, end = month_range(parsed_mes, parsed_anio)
    ventas = (
        db.execute(
            select(Venta)
            .options(selectinload(Venta.cliente), selectinload(Venta.pagos))
            .where(
                Venta.estado == EstadoVentaEnum.ACTIVO.value,
                Venta.creado_en >= start,
                Venta.creado_en < end,
            )
            .order_by(Venta.creado_en.asc(), Venta.id.asc())
        )
        .scalars()
        .all()
    )
    return VentasMensualesResponse(
        mes=parsed_mes,
        anio=parsed_anio,
        items=[venta_to_report_item(venta) for venta in ventas],
        resumen_mensual=build_monthly_summary(ventas, mes=parsed_mes, anio=parsed_anio),
    )


def list_ventas_for_export(
    db: Session,
    *,
    tipo: str | None,
    mes: int | str | None = None,
    anio: int | str | None = None,
) -> list[Venta]:
    parsed_tipo = validate_tipo_export(tipo)
    period = validate_export_period(mes, anio)

    filters = [
        Venta.estado == EstadoVentaEnum.ACTIVO.value,
        Venta.tipo == parsed_tipo,
    ]
    if period is not None:
        start, end = month_range(*period)
        filters.extend([Venta.creado_en >= start, Venta.creado_en < end])

    return (
        db.execute(
            select(Venta)
            .options(selectinload(Venta.cliente), selectinload(Venta.pagos))
            .where(*filters)
            .order_by(Venta.creado_en.asc(), Venta.id.asc())
        )
        .scalars()
        .all()
    )


EXPORT_HEADERS = (
    "Fecha",
    "Empresa",
    "Tipo",
    "Numero referencia",
    "Cliente",
    "Telefono",
    "Descripcion",
    "Valor total",
    "Medios de pago",
    "Estado",
)


def _format_pagos(venta: Venta) -> str:
    return "; ".join(f"{pago.medio}: {to_money(pago.monto):.2f}" for pago in venta.pagos)


def build_ventas_xlsx(ventas: Iterable[Venta]) -> bytes:
    workbook = Workbook()
    sheet = workbook.active
    sheet.title = "Ventas"
    sheet.append(EXPORT_HEADERS)

    for venta in ventas:
        sheet.append(
            [
                venta.creado_en.strftime("%Y-%m-%d %H:%M:%S"),
                venta.empresa,
                venta.tipo,
                venta.numero_referencia,
                venta.cliente.nombre if venta.cliente else None,
                venta.cliente.telefono if venta.cliente else None,
                venta.descripcion,
                f"{to_money(venta.valor_total):.2f}",
                _format_pagos(venta),
                venta.estado,
            ]
        )

    output = BytesIO()
    workbook.save(output)
    return output.getvalue()
