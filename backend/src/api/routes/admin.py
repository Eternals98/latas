from pydantic import ValidationError
from fastapi import APIRouter, Body, Depends, HTTPException, status
from sqlalchemy.orm import Session

from src.api.schemas.admin import AdminLoginRequest, AdminTokenResponse
from src.core.config import settings
from src.db.session import get_db
from src.services.admin_auth import create_admin_token, validate_admin_credentials

router = APIRouter(prefix="/api/admin", tags=["Administracion"])


def _first_validation_message(exc: ValidationError) -> str:
    errors = exc.errors()
    if not errors:
        return "Payload inválido."
    message = errors[0].get("msg", "Payload inválido.")
    return str(message)


@router.post(
    "/login",
    response_model=AdminTokenResponse,
    responses={status.HTTP_401_UNAUTHORIZED: {"content": {"application/json": {"example": {"detail": "Credenciales inválidas."}}}}},
)
def admin_login(payload: dict = Body(...), db: Session = Depends(get_db)) -> AdminTokenResponse:
    try:
        request_payload = AdminLoginRequest.model_validate(payload)
    except ValidationError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=_first_validation_message(exc),
        ) from exc

    if not validate_admin_credentials(db, request_payload.username, request_payload.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales administrativas invalidas.",
        )

    token, expires_at = create_admin_token(request_payload.username)
    return AdminTokenResponse(
        access_token=token,
        expires_in=settings.admin_jwt_ttl_seconds,
        expires_at=expires_at,
    )
