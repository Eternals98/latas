import pytest

from src.api.schemas.clientes import CreateClienteRequest
from src.models import Cliente
from src.services.clientes_service import ClienteDuplicateError, create_cliente, normalize_name, search_clientes


def _seed_cliente(db_session, nombre: str, telefono: str | None = None) -> Cliente:
    cliente = Cliente(nombre=nombre, telefono=telefono)
    db_session.add(cliente)
    db_session.commit()
    db_session.refresh(cliente)
    return cliente


def test_search_clientes_applies_top_10_and_deterministic_order(db_session):
    _seed_cliente(db_session, "Beta Uno")
    _seed_cliente(db_session, "Beta Dos")
    for index in range(1, 12):
        _seed_cliente(db_session, f"Alpha {index:02d}")

    results = search_clientes(db_session, "a")

    assert len(results) == 10
    assert [cliente.nombre for cliente in results] == [
        "Alpha 01",
        "Alpha 02",
        "Alpha 03",
        "Alpha 04",
        "Alpha 05",
        "Alpha 06",
        "Alpha 07",
        "Alpha 08",
        "Alpha 09",
        "Alpha 10",
    ]


def test_create_cliente_validates_nombre_required_and_telefono_optional(db_session):
    created = create_cliente(db_session, CreateClienteRequest(nombre="Cliente Uno", telefono=""))
    assert created.nombre == "Cliente Uno"
    assert created.telefono is None

    with pytest.raises(ValueError):
        CreateClienteRequest(nombre="   ", telefono=None)


def test_normalization_and_duplicate_decision_rules(db_session):
    payload = CreateClienteRequest(nombre="Cliente Andino", telefono=None)
    created = create_cliente(db_session, payload)
    assert created.nombre_normalizado == normalize_name("Cliente Andino")

    with pytest.raises(ClienteDuplicateError):
        create_cliente(db_session, CreateClienteRequest(nombre="  cliente andino  ", telefono=None))

    variant = create_cliente(db_session, CreateClienteRequest(nombre="Cliente Andino Norte", telefono=None))
    assert variant.id != created.id
