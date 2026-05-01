from pathlib import Path
import sys
from uuid import uuid4

import pytest
from sqlalchemy import event, text
from sqlalchemy.engine import Engine

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from fastapi.testclient import TestClient

from src.api.main import app
from src.db.base import Base
from src.db.session import SessionLocal, engine


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
