from datetime import datetime, timezone

import jwt
import pytest
from fastapi import HTTPException

import src.services.supabase_auth as supabase_auth


def test_decode_token_success(monkeypatch):
    monkeypatch.setattr(supabase_auth.settings, "supabase_jwt_audience", "authenticated")
    monkeypatch.setattr(supabase_auth, "get_supabase_jwt_issuer", lambda: "https://example.supabase.co/auth/v1")
    monkeypatch.setattr(jwt, "get_unverified_header", lambda token: {"kid": "kid-1"})
    monkeypatch.setattr(
        supabase_auth,
        "_load_jwks",
        lambda: {"keys": [{"kid": "kid-1", "alg": "RS256", "kty": "RSA"}]},
    )
    monkeypatch.setattr(jwt, "PyJWK", type("PyJWK", (), {"from_dict": staticmethod(lambda jwk: type("K", (), {"key": "PUBLIC_KEY"})())}))
    monkeypatch.setattr(
        jwt,
        "decode",
        lambda *args, **kwargs: {"sub": "user-1", "exp": 9999999999, "iat": 1, "iss": kwargs["issuer"]},
    )

    payload = supabase_auth._decode_token("token")
    assert payload["sub"] == "user-1"


def test_decode_token_rejects_when_kid_not_found(monkeypatch):
    monkeypatch.setattr(supabase_auth.settings, "supabase_jwt_audience", "authenticated")
    monkeypatch.setattr(supabase_auth, "get_supabase_jwt_issuer", lambda: "https://example.supabase.co/auth/v1")
    monkeypatch.setattr(jwt, "get_unverified_header", lambda token: {"kid": "missing-kid"})
    monkeypatch.setattr(
        supabase_auth,
        "_load_jwks",
        lambda: {"keys": [{"kid": "kid-1", "alg": "RS256", "kty": "RSA"}]},
    )
    monkeypatch.setattr(
        supabase_auth,
        "_decode_token_remote",
        lambda token: (_ for _ in ()).throw(HTTPException(status_code=401, detail="Token inválido o expirado.")),
    )

    with pytest.raises(HTTPException) as exc:
        supabase_auth._decode_token("token")
    assert exc.value.status_code == 401


def test_decode_token_rejects_invalid_signature(monkeypatch):
    monkeypatch.setattr(supabase_auth.settings, "supabase_jwt_audience", "authenticated")
    monkeypatch.setattr(supabase_auth, "get_supabase_jwt_issuer", lambda: "https://example.supabase.co/auth/v1")
    monkeypatch.setattr(jwt, "get_unverified_header", lambda token: {"kid": "kid-1"})
    monkeypatch.setattr(
        supabase_auth,
        "_load_jwks",
        lambda: {"keys": [{"kid": "kid-1", "alg": "RS256", "kty": "RSA"}]},
    )
    monkeypatch.setattr(jwt, "PyJWK", type("PyJWK", (), {"from_dict": staticmethod(lambda jwk: type("K", (), {"key": "PUBLIC_KEY"})())}))
    monkeypatch.setattr(
        supabase_auth,
        "_decode_token_remote",
        lambda token: (_ for _ in ()).throw(HTTPException(status_code=401, detail="Token inválido o expirado.")),
    )

    def _raise_invalid(*args, **kwargs):
        raise jwt.InvalidTokenError("invalid")

    monkeypatch.setattr(jwt, "decode", _raise_invalid)

    with pytest.raises(HTTPException) as exc:
        supabase_auth._decode_token("token")
    assert exc.value.status_code == 401


def test_load_jwks_reloads_after_expiration(monkeypatch):
    calls: list[str] = []
    monkeypatch.setattr(supabase_auth, "get_supabase_jwks_url", lambda: "https://example.supabase.co/auth/v1/.well-known/jwks.json")
    monkeypatch.setattr(supabase_auth.settings, "supabase_jwks_cache_ttl_seconds", 300)

    class Response:
        status_code = 200

        def raise_for_status(self):
            return None

        def json(self):
            calls.append("json")
            return {"keys": [{"kid": "kid-1", "alg": "RS256", "kty": "RSA"}]}

    monkeypatch.setattr(supabase_auth.httpx, "get", lambda *args, **kwargs: Response())
    supabase_auth._JWKS_CACHE["keys"] = None
    supabase_auth._JWKS_CACHE["expires_at"] = datetime.now(timezone.utc).replace(year=2000)

    first = supabase_auth._load_jwks()
    second = supabase_auth._load_jwks()
    assert first["keys"][0]["kid"] == "kid-1"
    assert second["keys"][0]["kid"] == "kid-1"
    assert len(calls) == 1
