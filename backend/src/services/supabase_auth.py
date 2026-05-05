from datetime import UTC, datetime, timedelta
from typing import Any

import httpx
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jwt import InvalidTokenError
from jwt.exceptions import MissingCryptographyError
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from src.core.config import get_supabase_jwks_url, get_supabase_jwt_issuer, settings
from src.db.session import get_db
from src.models.profile import Profile

security = HTTPBearer(auto_error=False)
_JWKS_CACHE: dict[str, Any] = {"keys": None, "expires_at": datetime.min.replace(tzinfo=UTC)}


def _auth_401() -> HTTPException:
    return HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido o expirado.")


def _auth_503(detail: str = "Servicio de autenticación no disponible.") -> HTTPException:
    return HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=detail)


def _load_jwks() -> dict[str, Any]:
    now = datetime.now(UTC)
    cached_keys = _JWKS_CACHE.get("keys")
    expires_at = _JWKS_CACHE.get("expires_at")
    if cached_keys and isinstance(expires_at, datetime) and expires_at > now:
        return cached_keys

    jwks_url = get_supabase_jwks_url().strip()
    if not jwks_url:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Supabase URL no configurada.")

    try:
        response = httpx.get(jwks_url, timeout=10.0)
        response.raise_for_status()
        data = response.json()
        if not isinstance(data, dict) or "keys" not in data:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="JWKS inválido.")
        _JWKS_CACHE["keys"] = data
        _JWKS_CACHE["expires_at"] = now + timedelta(seconds=max(30, settings.supabase_jwks_cache_ttl_seconds))
        return data
    except HTTPException:
        raise
    except Exception as exc:  # pragma: no cover
        raise _auth_503(f"Error cargando JWKS: {type(exc).__name__}: {exc}") from exc


def _decode_token(token: str) -> dict[str, Any]:
    issuer = get_supabase_jwt_issuer().strip()
    if not issuer:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Issuer JWT no configurado.")

    audience = settings.supabase_jwt_audience.strip() or None
    try:
        header = jwt.get_unverified_header(token)
        kid = header.get("kid")
        alg = (header.get("alg") or "").upper()
        if not kid or alg.startswith("HS"):
            raise _auth_401()

        keys = _load_jwks().get("keys", [])
        jwk = next((item for item in keys if item.get("kid") == kid), None)
        if jwk is None:
            raise _auth_401()

        public_key = jwt.PyJWK.from_dict(jwk).key
        options = {"require": ["exp", "iat", "sub"], "verify_aud": bool(audience)}
        payload = jwt.decode(
            token,
            key=public_key,
            algorithms=[jwk.get("alg", "RS256")],
            issuer=issuer,
            audience=audience,
            options=options,
        )
        if not isinstance(payload, dict):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido o expirado.")
        return payload
    except HTTPException:
        raise
    except InvalidTokenError as exc:
        raise _auth_401() from exc
    except MissingCryptographyError as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Falta instalar 'cryptography' para validar JWT ES256.",
        ) from exc
    except Exception as exc:  # pragma: no cover
        raise _auth_503(f"Error decodificando JWT: {type(exc).__name__}: {exc}") from exc


def _display_name(payload: dict[str, Any]) -> str:
    meta = payload.get("user_metadata") or {}
    full_name = meta.get("full_name") or meta.get("name")
    email = payload.get("email")
    return full_name or email or "Usuario"


def ensure_profile(db: Session, payload: dict[str, Any]) -> Profile:
    user_id = payload.get("sub") or payload.get("id")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token sin subject.")

    profile = db.query(Profile).filter(Profile.id == user_id).first()
    if profile:
        return profile

    profile = Profile(
        id=user_id,
        full_name=_display_name(payload),
        role="cashier",
        is_active=True,
        created_at=datetime.utcnow(),
    )
    try:
        db.add(profile)
        db.commit()
        db.refresh(profile)
        return profile
    except SQLAlchemyError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="No fue posible sincronizar el perfil de usuario.",
        ) from exc


def _set_request_context(db: Session, payload: dict[str, Any]) -> None:
    user_id = payload.get("sub") or payload.get("id")
    if not user_id:
        return
    db.execute(
        text("select set_config('request.jwt.claim.sub', :user_id, true)"),
        {"user_id": user_id},
    )
    db.execute(text("select set_config('request.jwt.claim.role', 'authenticated', true)"))


def require_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
    db: Session = Depends(get_db),
) -> Profile:
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token requerido.")

    payload = _decode_token(credentials.credentials)
    try:
        profile = ensure_profile(db, payload)
        _set_request_context(db, payload)
    except SQLAlchemyError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Base de datos no disponible para validar usuario: {type(exc).__name__}: {exc}",
        ) from exc
    if not profile.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Usuario inactivo.")
    return profile


def require_admin(profile: Profile = Depends(require_user)) -> Profile:
    if profile.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Solo administradores.")
    return profile
