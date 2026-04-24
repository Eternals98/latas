from pydantic import ValidationError
from fastapi import APIRouter, Body, HTTPException, status

from src.api.schemas.admin import AdminLoginRequest, AdminTokenResponse
from src.api.schemas.ventas import ErrorResponse, get_first_validation_message
from src.core.config import settings
from src.services.admin_auth import create_admin_token, validate_admin_credentials

router = APIRouter(prefix="/api/admin", tags=["Administracion"])


@router.post(
    "/login",
    response_model=AdminTokenResponse,
    responses={status.HTTP_401_UNAUTHORIZED: {"model": ErrorResponse}},
)
def admin_login(payload: dict = Body(...)) -> AdminTokenResponse:
    try:
        request_payload = AdminLoginRequest.model_validate(payload)
    except ValidationError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=get_first_validation_message(exc),
        ) from exc

    if not validate_admin_credentials(request_payload.username, request_payload.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales administrativas invalidas.",
        )

    token, expires_at = create_admin_token()
    return AdminTokenResponse(
        access_token=token,
        expires_in=settings.admin_jwt_ttl_seconds,
        expires_at=expires_at,
    )
