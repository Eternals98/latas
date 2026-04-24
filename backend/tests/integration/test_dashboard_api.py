from datetime import datetime

from src.models import EstadoVentaEnum


def test_dashboard_api_returns_active_sales_indicators(client, dashboard_sale_factory):
    dashboard_sale_factory(
        referencia="ABR-1",
        valor_total="100.00",
        creado_en=datetime(2026, 4, 2),
        empresa="latas_sas",
        pagos=[("efectivo", "100.00")],
    )
    dashboard_sale_factory(
        referencia="MAY-1",
        valor_total="50.00",
        creado_en=datetime(2026, 5, 2),
        empresa="tomas_gomez",
        pagos=[("tarjeta", "50.00")],
    )
    dashboard_sale_factory(
        referencia="VOID-1",
        valor_total="999.00",
        creado_en=datetime(2026, 4, 3),
        estado=EstadoVentaEnum.ANULADO.value,
        pagos=[("efectivo", "999.00")],
    )

    response = client.get("/api/dashboard")

    assert response.status_code == 200
    body = response.json()
    assert body["total_ventas"] == "150.00"
    assert body["cantidad_ventas"] == 2
    assert body["ticket_promedio"] == "75.00"
    assert [(item["periodo"], item["valor_total"]) for item in body["ventas_por_mes"]] == [
        ("2026-04", "100.00"),
        ("2026-05", "50.00"),
    ]
    assert sum(float(item["valor_total"]) for item in body["ventas_por_empresa"]) == 150.0


def test_dashboard_api_empty_data_returns_zero_state(client, db_session):
    response = client.get("/api/dashboard")

    assert response.status_code == 200
    body = response.json()
    assert body["ventas_por_mes"] == []
    assert body["ventas_por_empresa"] == []
    assert body["metodos_pago"] == []
    assert body["total_ventas"] == "0.00"
    assert body["total_mes_actual"] == "0.00"
    assert body["ticket_promedio"] == "0.00"
    assert body["cantidad_ventas"] == 0


def test_dashboard_api_payment_methods_use_payment_amounts_for_mixed_sales(client, dashboard_sale_factory):
    dashboard_sale_factory(
        referencia="MIX-1",
        valor_total="300.00",
        creado_en=datetime(2026, 4, 2),
        pagos=[("efectivo", "100.00"), ("transferencia", "200.00")],
    )

    response = client.get("/api/dashboard")

    assert response.status_code == 200
    body = response.json()
    assert body["metodos_pago"] == [
        {"medio": "transferencia", "cantidad_pagos": 1, "valor_total": "200.00", "porcentaje": "66.67"},
        {"medio": "efectivo", "cantidad_pagos": 1, "valor_total": "100.00", "porcentaje": "33.33"},
    ]


def test_dashboard_api_handles_normal_operational_volume_under_contract(client, dashboard_sale_factory):
    for index in range(120):
        dashboard_sale_factory(
            referencia=f"VOL-{index:03d}",
            valor_total="10.00",
            creado_en=datetime(2026, 4, (index % 28) + 1),
            empresa="latas_sas" if index % 2 == 0 else "tomas_gomez",
            pagos=[("efectivo" if index % 3 else "tarjeta", "10.00")],
        )

    response = client.get("/api/dashboard")

    assert response.status_code == 200
    assert response.elapsed.total_seconds() < 2
    assert response.json()["total_ventas"] == "1200.00"
