import re

from src.api.main import app
from src.api.schemas.dashboard import DashboardResponse


DECIMAL_PATTERN = re.compile(r"^\d+\.\d{2}$")


def assert_decimal_string(value: str) -> None:
    assert isinstance(value, str)
    assert DECIMAL_PATTERN.match(value)


def assert_dashboard_response_shape(body: dict) -> None:
    assert set(body) == {
        "ventas_por_mes",
        "ventas_por_empresa",
        "metodos_pago",
        "ticket_promedio",
        "total_ventas",
        "total_mes_actual",
        "cantidad_ventas",
        "generado_en",
    }
    assert isinstance(body["ventas_por_mes"], list)
    assert isinstance(body["ventas_por_empresa"], list)
    assert isinstance(body["metodos_pago"], list)
    assert_decimal_string(body["ticket_promedio"])
    assert_decimal_string(body["total_ventas"])
    assert_decimal_string(body["total_mes_actual"])
    assert isinstance(body["cantidad_ventas"], int)


def test_openapi_contains_dashboard_contract():
    schema = app.openapi()
    dashboard_get = schema["paths"]["/api/dashboard"]["get"]

    assert "200" in dashboard_get["responses"]
    success_ref = dashboard_get["responses"]["200"]["content"]["application/json"]["schema"]["$ref"]
    assert success_ref.endswith("/DashboardResponse")


def test_dashboard_schema_serializes_zero_response():
    payload = DashboardResponse(
        ventas_por_mes=[],
        ventas_por_empresa=[],
        metodos_pago=[],
        ticket_promedio="0.00",
        total_ventas="0.00",
        total_mes_actual="0.00",
        cantidad_ventas=0,
        generado_en="2026-04-24T10:00:00",
    ).model_dump(mode="json")

    assert_dashboard_response_shape(payload)
    assert payload["total_mes_actual"] == "0.00"


def test_dashboard_monthly_company_and_payment_item_shapes(client, dashboard_sale_factory):
    dashboard_sale_factory(
        referencia="DASH-001",
        valor_total="150.00",
        creado_en=__import__("datetime").datetime(2026, 4, 2),
        empresa="latas_sas",
        pagos=[("efectivo", "100.00"), ("tarjeta", "50.00")],
    )

    body = client.get("/api/dashboard").json()

    assert_dashboard_response_shape(body)
    month = body["ventas_por_mes"][0]
    assert set(month) == {"anio", "mes", "periodo", "cantidad_ventas", "valor_total"}
    assert month["periodo"] == "2026-04"
    assert_decimal_string(month["valor_total"])

    company = body["ventas_por_empresa"][0]
    assert set(company) == {"empresa", "cantidad_ventas", "valor_total"}
    assert_decimal_string(company["valor_total"])

    payment = body["metodos_pago"][0]
    assert set(payment) == {"medio", "cantidad_pagos", "valor_total", "porcentaje"}
    assert_decimal_string(payment["valor_total"])
    assert_decimal_string(payment["porcentaje"])
