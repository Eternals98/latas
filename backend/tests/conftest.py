from pathlib import Path
import sys
import os

import pytest
from sqlalchemy import text

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

ENV_PATH = ROOT / ".env"
if ENV_PATH.exists():
    for raw_line in ENV_PATH.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip())

from fastapi.testclient import TestClient

from src.api.main import app
from src.db.session import SessionLocal, engine, get_db
from src import models  # noqa: F401

MIGRATIONS_DIR = ROOT.parent / "supabase" / "migrations"
MIGRATION_FILES = [
    MIGRATIONS_DIR / "20260501092416_init_schema_and_seed.sql",
    MIGRATIONS_DIR / "202605010002_seed_profiles_from_auth_users.sql",
    MIGRATIONS_DIR / "202605030001_enforce_rls_and_cash_permissions.sql",
    MIGRATIONS_DIR / "202605030002_search_indexes_and_db_invariants.sql",
]


def _apply_sql_file(connection, sql_path: Path) -> None:
    sql = sql_path.read_text(encoding="utf-8")
    raw = connection.connection
    with raw.cursor() as cursor:
        cursor.execute(sql)
    raw.commit()


def _bootstrap_schema() -> None:
    with engine.connect() as connection:
        for migration in MIGRATION_FILES:
            if not migration.exists():
                continue
            _apply_sql_file(connection, migration)

@pytest.fixture(scope="session")
def _bootstrap_db() -> None:
    _bootstrap_schema()


@pytest.fixture(scope="session")
def client(_bootstrap_db) -> TestClient:
    return TestClient(app)


@pytest.fixture(scope="function")
def db_session(_bootstrap_db):
    connection = engine.connect()
    trans = connection.begin()
    connection.execute(text("SET search_path TO public, auth, pg_temp"))
    session = SessionLocal(bind=connection)
    app.dependency_overrides[get_db] = lambda: session
    try:
        yield session
    finally:
        app.dependency_overrides.pop(get_db, None)
        session.close()
        trans.rollback()
        connection.close()


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
