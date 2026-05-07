from __future__ import annotations

import hashlib
import hmac
import os
from datetime import datetime, timedelta, timezone
from typing import Any

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jwt import ExpiredSignatureError, InvalidTokenError
from sqlalchemy.orm import Session

from src.core.config import settings
from src.db.session import get_db
from src.models.admin_user import AdminUser


class AdminAuthError(Exception):
    pass


security = HTTPBearer(auto_error=False, scheme_name="bearerAuth")
PBKDF2_ITERATIONS = 240_000
PASSWORD_SCHEME = "pbkdf2_sha256"


def _hash_password(password: str, salt: bytes | None = None) -> str:
    used_salt = salt or os.urandom(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), used_salt, PBKDF2_ITERATIONS)
    return f"{PASSWORD_SCHEME}${PBKDF2_ITERATIONS}${used_salt.hex()}${digest.hex()}"


def _verify_password(password: str, encoded_hash: str) -> bool:
    try:
        scheme, iterations, salt_hex, digest_hex = encoded_hash.split("$", 3)
        if scheme != PASSWORD_SCHEME:
            return False
        calculated = hashlib.pbkdf2_hmac(
            "sha256",
            password.encode("utf-8"),
            bytes.fromhex(salt_hex),
            int(iterations),
        )
        return hmac.compare_digest(calculated.hex(), digest_hex)
    except Exception:
        return False


def ensure_initial_admin_user(db: Session) -> None:
    username = settings.admin_initial_username.strip()
    password = settings.admin_initial_password.strip()
    if not username:
        return

    exists = db.query(AdminUser).filter(AdminUser.username == username).first()
    if exists:
        return

    # Backward-compatible bootstrap if only ADMIN_PASSWORD is set.
    fallback_password = settings.admin_password.strip()
    chosen_password = password or fallback_password
    if not chosen_password:
        return

    db.add(
        AdminUser(
            username=username,
            password_hash=_hash_password(chosen_password),
            is_active=True,
        )
    )
    db.commit()


def validate_admin_credentials(db: Session, username: str, password: str) -> bool:
    user = (
        db.query(AdminUser)
        .filter(AdminUser.username == username, AdminUser.is_active.is_(True))
        .first()
    )
    if user is None:
        return False
    return _verify_password(password, user.password_hash)


def create_admin_token(username: str, now: datetime | None = None) -> tuple[str, datetime]:
    issued_at = now or datetime.now(timezone.utc)
    expires_at = issued_at + timedelta(seconds=settings.admin_jwt_ttl_seconds)
    payload: dict[str, Any] = {
        "sub": username,
        "scope": "admin",
        "iat": issued_at,
        "exp": expires_at,
    }
    token = jwt.encode(payload, settings.admin_jwt_secret, algorithm=settings.admin_jwt_algorithm)
    return token, expires_at


def verify_admin_token(token: str) -> dict[str, Any]:
    try:
        payload = jwt.decode(
            token,
            settings.admin_jwt_secret,
            algorithms=[settings.admin_jwt_algorithm],
        )
    except ExpiredSignatureError as exc:
        raise AdminAuthError("Token administrativo vencido.") from exc
    except InvalidTokenError as exc:
        raise AdminAuthError("Token administrativo invalido.") from exc

    if payload.get("scope") != "admin" or not payload.get("sub"):
        raise AdminAuthError("Token administrativo invalido.")
    return payload


def require_admin(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token administrativo requerido.",
        )
    try:
        payload = verify_admin_token(credentials.credentials)
    except AdminAuthError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc)) from exc

    user = (
        db.query(AdminUser)
        .filter(AdminUser.username == payload["sub"], AdminUser.is_active.is_(True))
        .first()
    )
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Usuario administrativo inactivo.")
    return payload
