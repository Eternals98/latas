from src.api.main import app


def test_openapi_contains_ventas_post_contract():
    schema = app.openapi()
    ventas_post = schema["paths"]["/api/ventas"]["post"]

    assert ventas_post["operationId"] == "create_venta_api_ventas_post"
    assert "201" in ventas_post["responses"]
    assert "400" in ventas_post["responses"]

    request_schema = ventas_post["requestBody"]["content"]["application/json"]["schema"]
    success_ref = ventas_post["responses"]["201"]["content"]["application/json"]["schema"]["$ref"]
    error_ref = ventas_post["responses"]["400"]["content"]["application/json"]["schema"]["$ref"]

    assert request_schema["type"] == "object"
    assert request_schema.get("additionalProperties", True) is True
    assert success_ref.endswith("/VentaResponse")
    assert error_ref.endswith("/ErrorResponse")
