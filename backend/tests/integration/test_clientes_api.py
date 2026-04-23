from sqlalchemy import select

from src.models import Cliente


def _create_cliente(db_session, *, nombre: str, telefono: str | None = None) -> Cliente:
    cliente = Cliente(nombre=nombre, telefono=telefono)
    db_session.add(cliente)
    db_session.commit()
    db_session.refresh(cliente)
    return cliente


def test_get_clientes_search_returns_partial_matches(client, db_session):
    _create_cliente(db_session, nombre="Comercial Andina SAS", telefono="3001111111")
    _create_cliente(db_session, nombre="Andina Ferreteria", telefono="3002222222")
    _create_cliente(db_session, nombre="Otro Cliente", telefono="3003333333")

    response = client.get("/api/clientes", params={"search": "andi"})

    assert response.status_code == 200
    body = response.json()
    assert len(body) == 2
    assert body[0]["nombre"] == "Andina Ferreteria"
    assert body[1]["nombre"] == "Comercial Andina SAS"


def test_get_clientes_search_handles_trimmed_empty_and_no_match(client, db_session):
    _create_cliente(db_session, nombre="Comercial Andina SAS")

    trimmed = client.get("/api/clientes", params={"search": "  andi  "})
    assert trimmed.status_code == 200
    assert len(trimmed.json()) == 1

    empty = client.get("/api/clientes", params={"search": "   "})
    assert empty.status_code == 200
    assert empty.json() == []

    no_match = client.get("/api/clientes", params={"search": "zzzz"})
    assert no_match.status_code == 200
    assert no_match.json() == []


def test_post_clientes_creates_cliente_with_traceability(client, db_session):
    payload = {"nombre": "Comercial Andina SAS", "telefono": "3001234567"}

    response = client.post("/api/clientes", json=payload)

    assert response.status_code == 201
    body = response.json()
    assert body["id"] is not None
    assert body["nombre"] == payload["nombre"]
    assert body["telefono"] == payload["telefono"]
    assert body["estado"] == "activo"
    assert body["creado_en"]
    assert body["modificado_en"]


def test_post_clientes_created_cliente_is_searchable(client, db_session):
    create_response = client.post(
        "/api/clientes",
        json={"nombre": "Comercial Andina SAS", "telefono": "3001234567"},
    )
    assert create_response.status_code == 201

    search_response = client.get("/api/clientes", params={"search": "andina"})
    assert search_response.status_code == 200
    body = search_response.json()
    assert len(body) == 1
    assert body[0]["nombre"] == "Comercial Andina SAS"


def test_post_clientes_rejects_exact_duplicate_by_normalized_name(client, db_session):
    first = client.post("/api/clientes", json={"nombre": "Comercial Andina SAS"})
    assert first.status_code == 201

    duplicate = client.post("/api/clientes", json={"nombre": "  comercial andina sas  "})
    assert duplicate.status_code == 409
    assert duplicate.json()["detail"] == "Ya existe un cliente con ese nombre."

    total = db_session.execute(
        select(Cliente).where(Cliente.nombre_normalizado == "comercial andina sas")
    ).scalars()
    assert len(list(total)) == 1


def test_post_clientes_allows_partial_name_variants(client, db_session):
    first = client.post("/api/clientes", json={"nombre": "Andina"})
    assert first.status_code == 201

    second = client.post("/api/clientes", json={"nombre": "Andina Norte"})
    assert second.status_code == 201

    search = client.get("/api/clientes", params={"search": "andina"})
    assert search.status_code == 200
    assert len(search.json()) == 2
