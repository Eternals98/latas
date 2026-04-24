from src.api.main import app


def test_openapi_contains_monthly_ventas_get_contract():
    schema = app.openapi()
    ventas_get = schema["paths"]["/api/ventas"]["get"]

    assert "200" in ventas_get["responses"]
    assert "400" in ventas_get["responses"]
    assert {param["name"] for param in ventas_get["parameters"]} == {"mes", "anio"}

    success_ref = ventas_get["responses"]["200"]["content"]["application/json"]["schema"]["$ref"]
    error_ref = ventas_get["responses"]["400"]["content"]["application/json"]["schema"]["$ref"]
    assert success_ref.endswith("/VentasMensualesResponse")
    assert error_ref.endswith("/ErrorResponse")


def test_openapi_contains_ventas_export_contract():
    schema = app.openapi()
    ventas_export = schema["paths"]["/api/ventas/export"]["get"]

    assert "200" in ventas_export["responses"]
    assert "400" in ventas_export["responses"]
    assert {param["name"] for param in ventas_export["parameters"]} == {"tipo", "mes", "anio"}
    assert (
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        in ventas_export["responses"]["200"]["content"]
    )


def test_openapi_keeps_ventas_post_contract():
    schema = app.openapi()
    ventas_post = schema["paths"]["/api/ventas"]["post"]

    assert "201" in ventas_post["responses"]
    assert "400" in ventas_post["responses"]
    assert ventas_post["responses"]["201"]["content"]["application/json"]["schema"]["$ref"].endswith(
        "/VentaResponse"
    )
