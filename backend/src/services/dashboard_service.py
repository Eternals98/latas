from __future__ import annotations

from datetime import UTC, date, datetime, time, timedelta
from decimal import Decimal

from sqlalchemy import case, extract, func, select
from sqlalchemy.orm import Session

from src.api.schemas.dashboard import (
    DashboardResponse,
    MetodoPagoDashboardItem,
    VentasPorEmpresaItem,
    VentasPorMesItem,
    to_money,
)
from src.models.company import Company
from src.models.payment_method import PaymentMethod
from src.models.transaction import Transaction
from src.models.transaction_payment import TransactionPayment


def _now() -> datetime:
    return datetime.now(UTC)


def _month_range(today: date | None = None) -> tuple[date, date]:
    current = today or datetime.now(UTC).date()
    start = current.replace(day=1)
    if current.month == 12:
        end = current.replace(year=current.year + 1, month=1, day=1)
    else:
        end = current.replace(month=current.month + 1, day=1)
    return start, end


def _start_of_day(value: date) -> datetime:
    return datetime.combine(value, time.min, tzinfo=UTC)


def _start_of_next_day(value: date) -> datetime:
    return datetime.combine(value + timedelta(days=1), time.min, tzinfo=UTC)


def get_dashboard(db: Session) -> DashboardResponse:
    active_conditions = Transaction.status == "confirmed"

    total_ventas = (
        db.execute(
            select(func.coalesce(func.sum(Transaction.total_amount), 0)).where(active_conditions)
        )
        .scalar_one()
    )
    cantidad_ventas = (
        db.execute(
            select(func.count()).select_from(Transaction).where(active_conditions)
        )
        .scalar_one()
    )

    start_of_month, next_month = _month_range()
    total_mes_actual = (
        db.execute(
            select(func.coalesce(func.sum(Transaction.total_amount), 0)).where(
                active_conditions,
                Transaction.transaction_date >= _start_of_day(start_of_month),
                Transaction.transaction_date < _start_of_day(next_month),
            )
        )
        .scalar_one()
    )

    ventas_por_mes_rows = db.execute(
        select(
            extract("year", Transaction.transaction_date).label("anio"),
            extract("month", Transaction.transaction_date).label("mes"),
            func.count(Transaction.id).label("cantidad_ventas"),
            func.coalesce(func.sum(Transaction.total_amount), 0).label("valor_total"),
        )
        .where(active_conditions)
        .group_by(extract("year", Transaction.transaction_date), extract("month", Transaction.transaction_date))
        .order_by(extract("year", Transaction.transaction_date).asc(), extract("month", Transaction.transaction_date).asc())
    ).all()

    ventas_por_mes = [
        VentasPorMesItem(
            anio=int(row.anio),
            mes=int(row.mes),
            periodo=f"{int(row.anio):04d}-{int(row.mes):02d}",
            cantidad_ventas=int(row.cantidad_ventas),
            valor_total=to_money(row.valor_total),
        )
        for row in ventas_por_mes_rows
    ]

    ventas_por_empresa_rows = db.execute(
        select(
            Company.name.label("empresa"),
            func.count(Transaction.id).label("cantidad_ventas"),
            func.coalesce(func.sum(Transaction.total_amount), 0).label("valor_total"),
        )
        .join(Company, Company.id == Transaction.company_id)
        .where(active_conditions)
        .group_by(Company.name)
        .order_by(func.sum(Transaction.total_amount).desc(), Company.name.asc())
    ).all()

    ventas_por_empresa = [
        VentasPorEmpresaItem(
            empresa=row.empresa,
            cantidad_ventas=int(row.cantidad_ventas),
            valor_total=to_money(row.valor_total),
        )
        for row in ventas_por_empresa_rows
    ]

    payment_rows = db.execute(
        select(
            PaymentMethod.name.label("medio"),
            func.count(TransactionPayment.id).label("cantidad_pagos"),
            func.coalesce(func.sum(TransactionPayment.amount), 0).label("monto_total"),
        )
        .join(TransactionPayment, TransactionPayment.payment_method_id == PaymentMethod.id)
        .join(Transaction, Transaction.id == TransactionPayment.transaction_id)
        .where(active_conditions)
        .group_by(PaymentMethod.name)
        .order_by(func.sum(TransactionPayment.amount).desc(), PaymentMethod.name.asc())
    ).all()

    payment_total = sum((to_money(row.monto_total) for row in payment_rows), start=Decimal("0.00"))
    metodos_pago = [
        MetodoPagoDashboardItem(
            medio=row.medio,
            cantidad_pagos=int(row.cantidad_pagos),
            transacciones=int(row.cantidad_pagos),
            porcentaje=(to_money(row.monto_total) / payment_total * Decimal("100.00")) if payment_total > 0 else Decimal("0.00"),
            monto_total=to_money(row.monto_total),
        )
        for row in payment_rows
    ]

    ticket_promedio = (to_money(total_ventas) / cantidad_ventas) if cantidad_ventas > 0 else Decimal("0.00")

    return DashboardResponse(
        ventas_por_mes=ventas_por_mes,
        ventas_por_empresa=ventas_por_empresa,
        metodos_pago=metodos_pago,
        ticket_promedio=to_money(ticket_promedio),
        total_ventas=to_money(total_ventas),
        total_mes_actual=to_money(total_mes_actual),
        cantidad_ventas=int(cantidad_ventas),
        generado_en=_now(),
    )
