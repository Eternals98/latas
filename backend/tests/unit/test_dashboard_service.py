from datetime import datetime
from decimal import Decimal

from src.models import EstadoVentaEnum, Pago, Venta
from src.services.dashboard_service import get_dashboard


def _sale(
    db_session,
    *,
    referencia: str,
    valor_total: str,
    creado_en: datetime,
    empresa: str = "latas_sas",
    estado: str = EstadoVentaEnum.ACTIVO.value,
    pagos: list[tuple[str, str]] | None = None,
) -> Venta:
    venta = Venta(
        empresa=empresa,
        tipo="formal",
        numero_referencia=referencia,
        descripcion="Venta dashboard",
        fecha_venta=creado_en.date(),
        valor_total=Decimal(valor_total),
        estado=estado,
        creado_en=creado_en,
        modificado_en=creado_en,
    )
    db_session.add(venta)
    db_session.flush()
    for medio, monto in (pagos or [("efectivo", valor_total)]):
        db_session.add(Pago(venta_id=venta.id, medio=medio, monto=Decimal(monto)))
    db_session.commit()
    return venta


def test_dashboard_returns_zero_state_without_active_sales(db_session):
    dashboard = get_dashboard(db_session, now=datetime(2026, 4, 24, 10, 0, 0))

    assert dashboard.ventas_por_mes == []
    assert dashboard.ventas_por_empresa == []
    assert dashboard.metodos_pago == []
    assert dashboard.total_ventas == Decimal("0.00")
    assert dashboard.total_mes_actual == Decimal("0.00")
    assert dashboard.ticket_promedio == Decimal("0.00")
    assert dashboard.cantidad_ventas == 0


def test_dashboard_aggregates_monthly_current_month_and_average_active_only(db_session):
    _sale(db_session, referencia="ABR-1", valor_total="100.00", creado_en=datetime(2026, 4, 2))
    _sale(db_session, referencia="ABR-2", valor_total="50.00", creado_en=datetime(2026, 4, 8))
    _sale(db_session, referencia="MAR-1", valor_total="75.00", creado_en=datetime(2026, 3, 31))
    _sale(
        db_session,
        referencia="ABR-ANULADA",
        valor_total="999.00",
        creado_en=datetime(2026, 4, 3),
        estado=EstadoVentaEnum.ANULADO.value,
    )

    dashboard = get_dashboard(db_session, now=datetime(2026, 4, 24, 10, 0, 0))

    assert [(item.periodo, item.cantidad_ventas, item.valor_total) for item in dashboard.ventas_por_mes] == [
        ("2026-03", 1, Decimal("75.00")),
        ("2026-04", 2, Decimal("150.00")),
    ]
    assert dashboard.total_ventas == Decimal("225.00")
    assert dashboard.total_mes_actual == Decimal("150.00")
    assert dashboard.ticket_promedio == Decimal("75.00")
    assert dashboard.cantidad_ventas == 3


def test_dashboard_aggregates_companies_sorted_by_total_and_excludes_annulled(db_session):
    _sale(db_session, referencia="LAT-1", valor_total="50.00", creado_en=datetime(2026, 4, 2), empresa="latas_sas")
    _sale(db_session, referencia="TOM-1", valor_total="200.00", creado_en=datetime(2026, 4, 3), empresa="tomas_gomez")
    _sale(
        db_session,
        referencia="TOM-ANULADA",
        valor_total="500.00",
        creado_en=datetime(2026, 4, 4),
        empresa="tomas_gomez",
        estado=EstadoVentaEnum.ANULADO.value,
    )

    dashboard = get_dashboard(db_session, now=datetime(2026, 4, 24))

    assert [(item.empresa, item.cantidad_ventas, item.valor_total) for item in dashboard.ventas_por_empresa] == [
        ("tomas_gomez", 1, Decimal("200.00")),
        ("latas_sas", 1, Decimal("50.00")),
    ]
    assert sum(item.valor_total for item in dashboard.ventas_por_empresa) == dashboard.total_ventas


def test_dashboard_aggregates_mixed_payment_methods_and_percentages(db_session):
    _sale(
        db_session,
        referencia="MIX-1",
        valor_total="150.00",
        creado_en=datetime(2026, 4, 2),
        pagos=[("efectivo", "100.00"), ("tarjeta", "50.00")],
    )
    _sale(
        db_session,
        referencia="CASH-1",
        valor_total="50.00",
        creado_en=datetime(2026, 4, 3),
        pagos=[("efectivo", "50.00")],
    )
    _sale(
        db_session,
        referencia="VOID-1",
        valor_total="100.00",
        creado_en=datetime(2026, 4, 4),
        estado=EstadoVentaEnum.ANULADO.value,
        pagos=[("transferencia", "100.00")],
    )

    dashboard = get_dashboard(db_session, now=datetime(2026, 4, 24))

    assert [(item.medio, item.cantidad_pagos, item.valor_total, item.porcentaje) for item in dashboard.metodos_pago] == [
        ("efectivo", 2, Decimal("150.00"), Decimal("75.00")),
        ("tarjeta", 1, Decimal("50.00"), Decimal("25.00")),
    ]
