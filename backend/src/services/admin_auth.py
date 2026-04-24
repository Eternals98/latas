from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jwt import ExpiredSignatureError, InvalidTokenError

from src.core.config import settings


class AdminAuthError(Exception):
    pass


security = HTTPBearer(auto_error=False, scheme_name="bearerAuth")


def validate_admin_credentials(username: str, password: str) -> bool:
    return username == settings.admin_username and password == settings.admin_password


def create_admin_token(now: datetime | None = None) -> tuple[str, datetime]:
    issued_at = now or datetime.now(timezone.utc)
    expires_at = issued_at + timedelta(seconds=settings.admin_jwt_ttl_seconds)
    payload: dict[str, Any] = {
        "sub": settings.admin_username,
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

    if payload.get("sub") != settings.admin_username or payload.get("scope") != "admin":
        raise AdminAuthError("Token administrativo invalido.")
    return payload


def require_admin(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
) -> dict[str, Any]:
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token administrativo requerido.",
        )
    try:
        return verify_admin_token(credentials.credentials)
    except AdminAuthError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc)) from exc
