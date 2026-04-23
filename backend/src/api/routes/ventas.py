from pydantic import ValidationError
from fastapi import APIRouter, Body, Depends, HTTPException, status
from sqlalchemy.orm import Session

from src.api.schemas.ventas import (
    ErrorResponse,
    VentaResponse,
    get_first_validation_message,
    parse_create_venta_payload,
    venta_to_response,
)
from src.db.session import get_db
from src.services.ventas_service import VentaValidationError, create_venta_with_pagos

router = APIRouter(prefix="/api/ventas", tags=["Ventas"])


@router.post(
    "",
    response_model=VentaResponse,
    status_code=status.HTTP_201_CREATED,
    responses={status.HTTP_400_BAD_REQUEST: {"model": ErrorResponse}},
)
def create_venta(payload: dict = Body(...), db: Session = Depends(get_db)) -> VentaResponse:
    try:
        request_payload = parse_create_venta_payload(payload)
    except ValidationError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=get_first_validation_message(exc),
        ) from exc

    try:
        venta = create_venta_with_pagos(db=db, payload=request_payload)
    except VentaValidationError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

    return venta_to_response(venta)
