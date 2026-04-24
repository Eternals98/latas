from src.api.main import app


def _response_ref(operation: dict, status_code: str) -> str:
    return operation["responses"][status_code]["content"]["application/json"]["schema"]["$ref"]


def test_openapi_contains_admin_login_contract():
    schema = app.openapi()
    login = schema["paths"]["/api/admin/login"]["post"]

    assert "200" in login["responses"]
    assert "401" in login["responses"]
    assert _response_ref(login, "200").endswith("/AdminTokenResponse")
    assert _response_ref(login, "401").endswith("/ErrorResponse")


def test_openapi_contains_update_venta_admin_contract():
    schema = app.openapi()
    update = schema["paths"]["/api/ventas/{venta_id}"]["put"]

    assert "bearerAuth" in schema["components"]["securitySchemes"]
    assert update["requestBody"]["content"]["application/json"]["schema"]["$ref"].endswith(
        "/UpdateVentaRequest"
    )
    assert update["security"] == [{"bearerAuth": []}]
    assert _response_ref(update, "200").endswith("/VentaResponse")
    for status_code in ("400", "401", "404", "409"):
        assert _response_ref(update, status_code).endswith("/ErrorResponse")


def test_openapi_contains_delete_venta_admin_contract():
    schema = app.openapi()
    delete = schema["paths"]["/api/ventas/{venta_id}"]["delete"]

    assert delete["security"] == [{"bearerAuth": []}]
    assert _response_ref(delete, "200").endswith("/VentaResponse")
    assert _response_ref(delete, "401").endswith("/ErrorResponse")
    assert _response_ref(delete, "404").endswith("/ErrorResponse")
