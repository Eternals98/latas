from pathlib import Path
import sys
from datetime import datetime
from decimal import Decimal
from uuid import uuid4

import pytest
from sqlalchemy import event, text
from sqlalchemy.engine import Engine

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from fastapi.testclient import TestClient
from src.api.main import app
from src.db.session import SessionLocal, engine
from src.db.base import Base
from src.models import EstadoVentaEnum, Pago, Venta

@pytest.fixture(scope="session", autouse=True)
def isolated_test_schema():
    schema_name = f"test_{uuid4().hex}"

    @event.listens_for(Engine, "connect")
    def set_search_path(dbapi_connection, _connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute(f'SET search_path TO "{schema_name}", public')
        cursor.close()

    with engine.begin() as connection:
        connection.execute(text(f'CREATE SCHEMA IF NOT EXISTS "{schema_name}"'))

    engine.dispose()
    try:
        yield schema_name
    finally:
        engine.dispose()
        with engine.begin() as connection:
            connection.execute(text(f'DROP SCHEMA IF EXISTS "{schema_name}" CASCADE'))


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
    empresa: str = "latas_sas",
    creado_en: datetime | None = None,
    pagos: list[tuple[str, str]] | None = None,
    cliente_id: int | None = None,
) -> Venta:
    timestamp = creado_en or datetime.utcnow()
    venta = Venta(
        empresa=empresa,
        tipo="formal",
        numero_referencia=referencia,
        descripcion="Venta admin",
        fecha_venta=timestamp.date(),
        valor_total=Decimal(valor_total),
        cliente_id=cliente_id,
        estado=estado,
        creado_en=timestamp,
        modificado_en=timestamp,
    )
    db_session.add(venta)
    db_session.flush()
    for medio, monto in (pagos or [("efectivo", valor_total)]):
        db_session.add(Pago(venta_id=venta.id, medio=medio, monto=Decimal(monto)))
    db_session.commit()
    return venta


def create_dashboard_sale(
    db_session,
    *,
    referencia: str,
    valor_total: str,
    creado_en: datetime,
    empresa: str = "latas_sas",
    estado: str = EstadoVentaEnum.ACTIVO.value,
    pagos: list[tuple[str, str]] | None = None,
) -> Venta:
    return create_sale_fixture(
        db_session,
        referencia=referencia,
        estado=estado,
        valor_total=valor_total,
        empresa=empresa,
        creado_en=creado_en,
        pagos=pagos,
    )


@pytest.fixture
def dashboard_sale_factory(db_session):
    def factory(**kwargs):
        return create_dashboard_sale(db_session, **kwargs)

    return factory


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
