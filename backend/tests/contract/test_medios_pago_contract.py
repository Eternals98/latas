from src.api.main import app


def test_openapi_contains_medios_pago_get_contract():
    schema = app.openapi()
    medios_get = schema["paths"]["/api/medios-pago"]["get"]

    assert medios_get["operationId"] == "list_medios_pago_api_api_medios_pago_get"
    assert "200" in medios_get["responses"]

    response_schema = medios_get["responses"]["200"]["content"]["application/json"]["schema"]
    assert response_schema["type"] == "array"
    assert response_schema["items"]["$ref"].endswith("/MedioPagoResponse")


def test_openapi_contains_medios_pago_get_example_for_frontend_selector():
    schema = app.openapi()
    medios_get = schema["paths"]["/api/medios-pago"]["get"]

    example = medios_get["responses"]["200"]["content"]["application/json"]["example"]
    assert isinstance(example, list)
    assert {"id", "codigo", "nombre", "activo", "creado_en", "modificado_en"}.issubset(
        set(example[0].keys())
    )
