from __future__ import annotations

from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from src.api.schemas.ventas import CreateVentaRequest, to_money
from src.models import EstadoVentaEnum, Pago, Venta


class VentaValidationError(Exception):
    pass


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
