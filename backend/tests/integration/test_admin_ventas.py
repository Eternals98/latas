from datetime import datetime
from time import perf_counter

from sqlalchemy import select

from src.models import Cliente, EstadoVentaEnum, Pago, Venta


def _update_payload(**overrides):
    data = {
        "empresa": "tomas_gomez",
        "tipo": "informal",
        "numero_referencia": "ADM-API-EDIT",
        "descripcion": "Venta editada por admin",
        "valor_total": "150.00",
        "cliente_id": None,
        "pagos": [
            {"medio": "efectivo", "monto": "100.00"},
            {"medio": "transferencia", "monto": "50.00"},
        ],
    }
    data.update(overrides)
    return data


def test_admin_login_success_returns_token(client, db_session, admin_credentials):
    start = perf_counter()
    response = client.post("/api/admin/login", json=admin_credentials)
    elapsed = perf_counter() - start

    assert response.status_code == 200
    body = response.json()
    assert body["token_type"] == "bearer"
    assert body["expires_in"] == 28800
    assert body["access_token"]
    assert body["expires_at"]
    assert elapsed < 1


def test_admin_login_invalid_credentials_returns_401(client, db_session):
    response = client.post("/api/admin/login", json={"username": "admin", "password": "bad"})

    assert response.status_code == 401


def test_protected_routes_reject_missing_bearer_token(client, db_session, active_sale):
    response = client.delete(f"/api/ventas/{active_sale.id}")

    assert response.status_code == 401


def test_update_venta_success(client, db_session, admin_headers, active_sale):
    original_id = active_sale.id
    original_created = active_sale.creado_en.isoformat()
    start = perf_counter()

    response = client.put(f"/api/ventas/{active_sale.id}", json=_update_payload(), headers=admin_headers)
    elapsed = perf_counter() - start

    assert response.status_code == 200
    body = response.json()
    assert body["id"] == original_id
    assert body["creado_en"] == original_created
    assert body["estado"] == EstadoVentaEnum.ACTIVO.value
    assert body["numero_referencia"] == "ADM-API-EDIT"
    assert body["valor_total"] == "150.00"
    assert [pago["monto"] for pago in body["pagos"]] == ["100.00", "50.00"]
    assert elapsed < 2


def test_update_venta_rejects_invalid_payload(client, db_session, admin_headers, active_sale):
    response = client.put(
        f"/api/ventas/{active_sale.id}",
        json=_update_payload(valor_total="151.00"),
        headers=admin_headers,
    )

    assert response.status_code == 400


def test_update_venta_rejects_nonexistent_cliente_id(client, db_session, admin_headers, active_sale):
    response = client.put(
        f"/api/ventas/{active_sale.id}",
        json=_update_payload(cliente_id=9999),
        headers=admin_headers,
    )

    assert response.status_code == 400


def test_update_venta_accepts_existing_cliente_id(client, db_session, admin_headers, active_sale):
    cliente = Cliente(nombre="Cliente API", telefono="300")
    db_session.add(cliente)
    db_session.commit()

    response = client.put(
        f"/api/ventas/{active_sale.id}",
        json=_update_payload(cliente_id=cliente.id),
        headers=admin_headers,
    )

    assert response.status_code == 200
    assert response.json()["cliente_id"] == cliente.id


def test_update_venta_missing_token_returns_401(client, db_session, active_sale):
    response = client.put(f"/api/ventas/{active_sale.id}", json=_update_payload())

    assert response.status_code == 401


def test_update_venta_nonexistent_sale_returns_404(client, db_session, admin_headers):
    response = client.put("/api/ventas/9999", json=_update_payload(), headers=admin_headers)

    assert response.status_code == 404


def test_update_venta_annulled_sale_returns_409(client, db_session, admin_headers, annulled_sale):
    response = client.put(f"/api/ventas/{annulled_sale.id}", json=_update_payload(), headers=admin_headers)

    assert response.status_code == 409


def test_delete_venta_annuls_and_preserves_row(client, db_session, admin_headers, active_sale):
    start = perf_counter()
    response = client.delete(f"/api/ventas/{active_sale.id}", headers=admin_headers)
    elapsed = perf_counter() - start

    assert response.status_code == 200
    assert response.json()["estado"] == EstadoVentaEnum.ANULADO.value
    assert elapsed < 2
    db_session.expire_all()
    persisted = db_session.execute(select(Venta).where(Venta.id == active_sale.id)).scalar_one()
    assert persisted.estado == EstadoVentaEnum.ANULADO.value


def test_delete_venta_is_idempotent(client, db_session, admin_headers, annulled_sale):
    first = client.delete(f"/api/ventas/{annulled_sale.id}", headers=admin_headers)
    second = client.delete(f"/api/ventas/{annulled_sale.id}", headers=admin_headers)

    assert first.status_code == 200
    assert second.status_code == 200
    assert second.json()["estado"] == EstadoVentaEnum.ANULADO.value
    pagos = db_session.execute(select(Pago).where(Pago.venta_id == annulled_sale.id)).scalars().all()
    assert len(pagos) == 1


def test_delete_venta_not_found_returns_404(client, db_session, admin_headers):
    response = client.delete("/api/ventas/9999", headers=admin_headers)

    assert response.status_code == 404


def test_annulled_sale_is_excluded_from_active_monthly_report(
    client,
    db_session,
    admin_headers,
    active_sale,
):
    active_sale.creado_en = datetime(2026, 4, 2)
    db_session.commit()
    client.delete(f"/api/ventas/{active_sale.id}", headers=admin_headers)

    response = client.get("/api/ventas?mes=4&anio=2026")

    assert response.status_code == 200
    assert response.json()["items"] == []
