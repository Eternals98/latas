from io import BytesIO

from pydantic import ValidationError
from fastapi import APIRouter, Body, Depends, HTTPException, Query, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from src.api.schemas.ventas import (
    ErrorResponse,
    VentaResponse,
    VentasMensualesResponse,
    get_first_validation_message,
    parse_create_venta_payload,
    UpdateVentaRequest,
    venta_to_response,
)
from src.db.session import get_db
from src.services.admin_auth import require_admin
from src.services.ventas_service import (
    VentaConflictError,
    VentaNotFoundError,
    VentaValidationError,
    annul_venta,
    build_ventas_xlsx,
    create_venta_with_pagos,
    list_ventas_by_month,
    list_ventas_for_export,
    update_venta_with_pagos,
    validate_tipo_export,
)

router = APIRouter(prefix="/api/ventas", tags=["Ventas"])


@router.get(
    "",
    response_model=VentasMensualesResponse,
    responses={status.HTTP_400_BAD_REQUEST: {"model": ErrorResponse}},
)
def get_ventas_by_month(
    mes: str | None = Query(default=None),
    anio: str | None = Query(default=None),
    db: Session = Depends(get_db),
) -> VentasMensualesResponse:
    try:
        return list_ventas_by_month(db=db, mes=mes, anio=anio)
    except VentaValidationError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.get(
    "/export",
    responses={
        status.HTTP_200_OK: {
            "content": {
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": {
                    "schema": {"type": "string", "format": "binary"}
                }
            }
        },
        status.HTTP_400_BAD_REQUEST: {"model": ErrorResponse},
    },
)
def export_ventas(
    tipo: str | None = Query(default=None),
    mes: str | None = Query(default=None),
    anio: str | None = Query(default=None),
    db: Session = Depends(get_db),
) -> StreamingResponse:
    try:
        ventas = list_ventas_for_export(db=db, tipo=tipo, mes=mes, anio=anio)
        xlsx_payload = build_ventas_xlsx(ventas)
        cleaned_tipo = validate_tipo_export(tipo)
    except VentaValidationError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

    period_suffix = f"-{int(anio):04d}-{int(mes):02d}" if mes and anio else ""
    filename = f"ventas-{cleaned_tipo}{period_suffix}.xlsx"
    return StreamingResponse(
        BytesIO(xlsx_payload),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


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


@router.put(
    "/{venta_id}",
    response_model=VentaResponse,
    responses={
        status.HTTP_400_BAD_REQUEST: {"model": ErrorResponse},
        status.HTTP_401_UNAUTHORIZED: {"model": ErrorResponse},
        status.HTTP_404_NOT_FOUND: {"model": ErrorResponse},
        status.HTTP_409_CONFLICT: {"model": ErrorResponse},
    },
)
def update_venta(
    venta_id: int,
    payload: UpdateVentaRequest,
    db: Session = Depends(get_db),
    _admin: dict = Depends(require_admin),
) -> VentaResponse:
    try:
        venta = update_venta_with_pagos(db=db, venta_id=venta_id, payload=payload)
    except VentaValidationError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    except VentaNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    except VentaConflictError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc

    return venta_to_response(venta)


@router.delete(
    "/{venta_id}",
    response_model=VentaResponse,
    responses={
        status.HTTP_401_UNAUTHORIZED: {"model": ErrorResponse},
        status.HTTP_404_NOT_FOUND: {"model": ErrorResponse},
    },
)
def delete_venta(
    venta_id: int,
    db: Session = Depends(get_db),
    _admin: dict = Depends(require_admin),
) -> VentaResponse:
    try:
        venta = annul_venta(db=db, venta_id=venta_id)
    except VentaNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc

    return venta_to_response(venta)
