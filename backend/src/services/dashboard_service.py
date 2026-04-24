from __future__ import annotations

from collections import defaultdict
from datetime import datetime
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from src.api.schemas.dashboard import (
    DashboardResponse,
    MetodoPagoDashboardItem,
    VentasPorEmpresaItem,
    VentasPorMesItem,
)
from src.api.schemas.ventas import to_money
from src.models import EstadoVentaEnum, Venta


def _current_month_range(now: datetime) -> tuple[datetime, datetime]:
    start = datetime(now.year, now.month, 1)
    if now.month == 12:
        end = datetime(now.year + 1, 1, 1)
    else:
        end = datetime(now.year, now.month + 1, 1)
    return start, end


def _percentage(part: Decimal, total: Decimal) -> Decimal:
    if total == Decimal("0.00"):
        return Decimal("0.00")
    return to_money((part / total) * Decimal("100"))


def get_dashboard(db: Session, *, now: datetime | None = None) -> DashboardResponse:
    generated_at = now or datetime.utcnow()
    active_sales = (
        db.execute(
            select(Venta)
            .options(selectinload(Venta.pagos))
            .where(Venta.estado == EstadoVentaEnum.ACTIVO.value)
            .order_by(Venta.creado_en.asc(), Venta.id.asc())
        )
        .scalars()
        .all()
    )

    total_ventas = sum((to_money(venta.valor_total) for venta in active_sales), start=Decimal("0.00"))
    cantidad_ventas = len(active_sales)
    ticket_promedio = to_money(total_ventas / cantidad_ventas) if cantidad_ventas else Decimal("0.00")

    current_start, current_end = _current_month_range(generated_at)
    total_mes_actual = sum(
        (
            to_money(venta.valor_total)
            for venta in active_sales
            if current_start <= venta.creado_en < current_end
        ),
        start=Decimal("0.00"),
    )

    monthly: dict[tuple[int, int], dict[str, Decimal | int]] = defaultdict(
        lambda: {"cantidad_ventas": 0, "valor_total": Decimal("0.00")}
    )
    companies: dict[str, dict[str, Decimal | int]] = defaultdict(
        lambda: {"cantidad_ventas": 0, "valor_total": Decimal("0.00")}
    )
    payment_methods: dict[str, dict[str, Decimal | int]] = defaultdict(
        lambda: {"cantidad_pagos": 0, "valor_total": Decimal("0.00")}
    )

    for venta in active_sales:
        month_key = (venta.creado_en.year, venta.creado_en.month)
        monthly[month_key]["cantidad_ventas"] += 1
        monthly[month_key]["valor_total"] += to_money(venta.valor_total)

        companies[venta.empresa]["cantidad_ventas"] += 1
        companies[venta.empresa]["valor_total"] += to_money(venta.valor_total)

        for pago in venta.pagos:
            payment_methods[pago.medio]["cantidad_pagos"] += 1
            payment_methods[pago.medio]["valor_total"] += to_money(pago.monto)

    total_pagos = sum(
        (to_money(values["valor_total"]) for values in payment_methods.values()),
        start=Decimal("0.00"),
    )

    return DashboardResponse(
        ventas_por_mes=[
            VentasPorMesItem(
                anio=anio,
                mes=mes,
                periodo=f"{anio:04d}-{mes:02d}",
                cantidad_ventas=int(values["cantidad_ventas"]),
                valor_total=to_money(values["valor_total"]),
            )
            for (anio, mes), values in sorted(monthly.items())
        ],
        ventas_por_empresa=[
            VentasPorEmpresaItem(
                empresa=empresa,
                cantidad_ventas=int(values["cantidad_ventas"]),
                valor_total=to_money(values["valor_total"]),
            )
            for empresa, values in sorted(
                companies.items(),
                key=lambda item: (-to_money(item[1]["valor_total"]), item[0]),
            )
        ],
        metodos_pago=[
            MetodoPagoDashboardItem(
                medio=medio,
                cantidad_pagos=int(values["cantidad_pagos"]),
                valor_total=to_money(values["valor_total"]),
                porcentaje=_percentage(to_money(values["valor_total"]), total_pagos),
            )
            for medio, values in sorted(
                payment_methods.items(),
                key=lambda item: (-to_money(item[1]["valor_total"]), item[0]),
            )
        ],
        ticket_promedio=ticket_promedio,
        total_ventas=to_money(total_ventas),
        total_mes_actual=to_money(total_mes_actual),
        cantidad_ventas=cantidad_ventas,
        generado_en=generated_at,
    )
