from datetime import datetime, timedelta, timezone

import pytest

from src.services.admin_auth import AdminAuthError, create_admin_token, validate_admin_credentials, verify_admin_token


def test_validate_admin_credentials_accepts_configured_values():
    assert validate_admin_credentials("admin", "admin-password") is True


def test_validate_admin_credentials_rejects_invalid_password():
    assert validate_admin_credentials("admin", "wrong") is False


def test_create_admin_token_has_eight_hour_expiry():
    issued_at = datetime.now(timezone.utc) - timedelta(seconds=1)

    token, expires_at = create_admin_token(now=issued_at)
    payload = verify_admin_token(token)

    assert expires_at == issued_at + timedelta(hours=8)
    assert payload["sub"] == "admin"
    assert payload["scope"] == "admin"


def test_verify_admin_token_rejects_invalid_token():
    with pytest.raises(AdminAuthError):
        verify_admin_token("not-a-jwt")


def test_verify_admin_token_rejects_expired_token():
    issued_at = datetime.now(timezone.utc) - timedelta(hours=9)
    token, _expires_at = create_admin_token(now=issued_at)

    with pytest.raises(AdminAuthError):
        verify_admin_token(token)
