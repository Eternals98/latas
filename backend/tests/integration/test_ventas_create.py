from sqlalchemy import select

from src.models import Venta


def test_create_venta_with_multiple_payments_returns_201(client, db_session):
    payload = {
        "empresa": "latas_sas",
        "tipo": "formal",
        "numero_referencia": "V-1001",
        "descripcion": "Venta mostrador",
        "valor_total": "100000.00",
        "cliente_id": None,
        "pagos": [
            {"medio": "efectivo", "monto": "60000.00"},
            {"medio": "transferencia", "monto": "40000.00"},
        ],
    }

    response = client.post("/api/ventas", json=payload)

    assert response.status_code == 201
    body = response.json()
    assert body["empresa"] == payload["empresa"]
    assert body["valor_total"] == "100000.00"
    assert len(body["pagos"]) == 2
    assert body["pagos"][0]["monto"] == "60000.00"
    assert body["pagos"][1]["monto"] == "40000.00"


def test_create_venta_total_mismatch_returns_400_and_rolls_back(client, db_session):
    payload = {
        "empresa": "latas_sas",
        "tipo": "formal",
        "numero_referencia": "V-1002",
        "descripcion": "Venta invalida",
        "valor_total": "100000.00",
        "pagos": [{"medio": "efectivo", "monto": "90000.00"}],
    }

    response = client.post("/api/ventas", json=payload)

    assert response.status_code == 400
    assert response.json()["detail"] == "La suma de pagos no coincide con valor_total."

    persisted = db_session.execute(
        select(Venta).where(Venta.numero_referencia == "V-1002")
    ).scalar_one_or_none()
    assert persisted is None


def test_create_venta_missing_required_fields_returns_400(client, db_session):
    payload = {
        "numero_referencia": "V-1003",
        "descripcion": "Sin empresa ni tipo",
        "valor_total": "1000.00",
        "pagos": [{"medio": "efectivo", "monto": "1000.00"}],
    }

    response = client.post("/api/ventas", json=payload)

    assert response.status_code == 400
    assert "empresa" in response.json()["detail"]


def test_create_venta_empty_pagos_returns_400(client, db_session):
    payload = {
        "empresa": "latas_sas",
        "tipo": "formal",
        "numero_referencia": "V-1004",
        "descripcion": "Sin pagos",
        "valor_total": "1000.00",
        "pagos": [],
    }

    response = client.post("/api/ventas", json=payload)

    assert response.status_code == 400
    assert "pagos" in response.json()["detail"]
