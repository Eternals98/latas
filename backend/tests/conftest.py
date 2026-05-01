from pathlib import Path
import sys

import pytest
from sqlalchemy import text

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from fastapi.testclient import TestClient

from src.api.main import app
from src.db.base import Base
from src.db.session import SessionLocal, engine, get_db
from src import models  # noqa: F401

TEST_PROFILE_IDS = [
    ("11111111-1111-1111-1111-111111111111", "admin@example.com", "Admin"),
    ("22222222-2222-2222-2222-222222222222", "cashier@example.com", "Cajero"),
]


def _seed_auth_users():
    with engine.begin() as connection:
        for user_id, email, full_name in TEST_PROFILE_IDS:
            connection.execute(
                text(
                    """
                    insert into auth.users (
                        id, aud, role, email, encrypted_password, email_confirmed_at,
                        raw_app_meta_data, raw_user_meta_data, is_sso_user, is_anonymous,
                        created_at, updated_at
                    )
                    values (
                        cast(:id as uuid), 'authenticated', 'authenticated', cast(:email as text), '',
                        now(),
                        '{}'::jsonb,
                        jsonb_build_object('full_name', cast(:full_name as text), 'name', cast(:full_name as text)),
                        false,
                        false,
                        now(),
                        now()
                    )
                    on conflict (id) do update set
                        email = excluded.email,
                        raw_user_meta_data = excluded.raw_user_meta_data,
                        updated_at = excluded.updated_at
                    """
                ),
                {"id": user_id, "email": email, "full_name": full_name},
            )


@pytest.fixture(scope="session")
def client() -> TestClient:
    return TestClient(app)


@pytest.fixture(scope="function")
def db_session():
    _seed_auth_users()
    connection = engine.connect()
    trans = connection.begin()
    connection.execute(text("SET search_path TO public, auth, pg_temp"))
    Base.metadata.create_all(bind=connection)
    session = SessionLocal(bind=connection)
    app.dependency_overrides[get_db] = lambda: session
    try:
        yield session
    finally:
        app.dependency_overrides.pop(get_db, None)
        session.close()
        Base.metadata.drop_all(bind=connection)
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
