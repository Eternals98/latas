from pathlib import Path
import sys

import pytest

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from fastapi.testclient import TestClient
from src.api.main import app
from src.db.session import SessionLocal, engine
from src.db.base import Base
from src.models import EstadoVentaEnum, Pago, Venta


@pytest.fixture(scope="session")
def client() -> TestClient:
    return TestClient(app)


@pytest.fixture(scope="function")
def db_session():
    Base.metadata.create_all(bind=engine)
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture
def admin_credentials():
    return {"username": "admin", "password": "admin-password"}


@pytest.fixture
def admin_token(client, admin_credentials):
    response = client.post("/api/admin/login", json=admin_credentials)
    assert response.status_code == 200
    return response.json()["access_token"]


@pytest.fixture
def admin_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}


def create_sale_fixture(
    db_session,
    *,
    referencia: str = "ADM-001",
    estado: str = EstadoVentaEnum.ACTIVO.value,
    valor_total: str = "100.00",
    cliente_id: int | None = None,
) -> Venta:
    venta = Venta(
        empresa="latas_sas",
        tipo="formal",
        numero_referencia=referencia,
        descripcion="Venta admin",
        valor_total=valor_total,
        cliente_id=cliente_id,
        estado=estado,
    )
    db_session.add(venta)
    db_session.flush()
    db_session.add(Pago(venta_id=venta.id, medio="efectivo", monto=valor_total))
    db_session.commit()
    return venta


@pytest.fixture
def active_sale(db_session) -> Venta:
    return create_sale_fixture(db_session, referencia="ADM-ACTIVA")


@pytest.fixture
def annulled_sale(db_session) -> Venta:
    return create_sale_fixture(
        db_session,
        referencia="ADM-ANULADA",
        estado=EstadoVentaEnum.ANULADO.value,
    )
