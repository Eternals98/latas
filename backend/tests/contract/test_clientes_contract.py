from src.api.main import app


def test_openapi_contains_clientes_get_contract():
    schema = app.openapi()
    clientes_get = schema["paths"]["/api/clientes"]["get"]

    assert clientes_get["operationId"] == "search_clientes_api_api_clientes_get"
    assert "200" in clientes_get["responses"]

    search_param = clientes_get["parameters"][0]
    assert search_param["name"] == "search"
    assert search_param["in"] == "query"
    assert search_param["required"] is False

    response_schema = clientes_get["responses"]["200"]["content"]["application/json"]["schema"]
    assert response_schema["type"] == "array"
    assert response_schema["items"]["$ref"].endswith("/ClienteResponse")


def test_openapi_contains_clientes_post_201_contract_with_traceability():
    schema = app.openapi()
    clientes_post = schema["paths"]["/api/clientes"]["post"]

    assert clientes_post["operationId"] == "create_cliente_api_api_clientes_post"
    assert "201" in clientes_post["responses"]

    response_ref = clientes_post["responses"]["201"]["content"]["application/json"]["schema"]["$ref"]
    assert response_ref.endswith("/ClienteResponse")

    cliente_response = schema["components"]["schemas"]["ClienteResponse"]
    required = set(cliente_response["required"])
    assert {"id", "nombre", "creado_en", "modificado_en", "estado"}.issubset(required)


def test_openapi_contains_clientes_post_409_conflict_contract():
    schema = app.openapi()
    clientes_post = schema["paths"]["/api/clientes"]["post"]

    assert "409" in clientes_post["responses"]
    error_ref = clientes_post["responses"]["409"]["content"]["application/json"]["schema"]["$ref"]
    assert error_ref.endswith("/ErrorResponse")
