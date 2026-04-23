from sqlalchemy import update

from src.models import MedioPago
from src.services.medios_pago_service import ensure_initial_catalog


EXPECTED_MEDIOS = [
    "Bancolombia Latas",
    "Bancolombia Tomas",
    "BBVA Latas",
    "BBVA Tomas",
    "Davivienda",
    "Efectivo",
    "Nequi",
    "Otro",
    "Tarjeta Latas",
    "Tarjeta Tomas",
]


def test_get_medios_pago_returns_initial_catalog_of_10_items(client, db_session):
    ensure_initial_catalog(db_session)

    response = client.get("/api/medios-pago")

    assert response.status_code == 200
    body = response.json()
    assert len(body) == 10
    assert [item["nombre"] for item in body] == EXPECTED_MEDIOS


def test_get_medios_pago_response_includes_frontend_fields(client, db_session):
    ensure_initial_catalog(db_session)

    response = client.get("/api/medios-pago")

    assert response.status_code == 200
    first = response.json()[0]
    assert {"id", "codigo", "nombre", "activo", "creado_en", "modificado_en"}.issubset(first.keys())


def test_get_medios_pago_returns_empty_list_when_no_active_items(client, db_session):
    ensure_initial_catalog(db_session)

    db_session.execute(update(MedioPago).values(activo=False))
    db_session.commit()

    response = client.get("/api/medios-pago")

    assert response.status_code == 200
    assert response.json() == []
