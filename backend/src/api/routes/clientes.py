from pydantic import ValidationError
from fastapi import APIRouter, Body, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from src.api.schemas.clientes import (
    ClienteResponse,
    ErrorResponse,
    clientes_to_response,
    cliente_to_response,
    get_first_validation_message,
    parse_create_cliente_payload,
    parse_update_cliente_payload,
)
from src.db.session import get_db
from src.services.clientes_service import (
    ClienteDuplicateError,
    ClienteNotFoundError,
    ClienteValidationError,
    create_cliente,
    list_clientes,
    search_clientes,
    update_cliente,
)

router = APIRouter(prefix="/api/clientes", tags=["Clientes"])


@router.get(
    "",
    response_model=list[ClienteResponse],
)
def search_clientes_api(
    search: str | None = Query(default=None),
    db: Session = Depends(get_db),
) -> list[ClienteResponse]:
    clientes = search_clientes(db=db, search=search)
    return clientes_to_response(clientes)


@router.get(
    "/all",
    response_model=list[ClienteResponse],
)
def list_clientes_api(
    limit: int = Query(default=200, ge=1, le=500),
    db: Session = Depends(get_db),
) -> list[ClienteResponse]:
    clientes = list_clientes(db=db, limit=limit)
    return clientes_to_response(clientes)


@router.post(
    "",
    response_model=ClienteResponse,
    status_code=status.HTTP_201_CREATED,
    responses={
        status.HTTP_400_BAD_REQUEST: {"model": ErrorResponse},
        status.HTTP_409_CONFLICT: {"model": ErrorResponse},
    },
)
def create_cliente_api(payload: dict = Body(...), db: Session = Depends(get_db)) -> ClienteResponse:
    try:
        request_payload = parse_create_cliente_payload(payload)
    except ValidationError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=get_first_validation_message(exc),
        ) from exc

    try:
        cliente = create_cliente(db=db, payload=request_payload)
    except ClienteDuplicateError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc
    except ClienteValidationError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

    return cliente_to_response(cliente)


@router.put(
    "/{cliente_id}",
    response_model=ClienteResponse,
    responses={
        status.HTTP_400_BAD_REQUEST: {"model": ErrorResponse},
        status.HTTP_404_NOT_FOUND: {"model": ErrorResponse},
        status.HTTP_409_CONFLICT: {"model": ErrorResponse},
    },
)
def update_cliente_api(
    cliente_id: int,
    payload: dict = Body(...),
    db: Session = Depends(get_db),
) -> ClienteResponse:
    try:
        request_payload = parse_update_cliente_payload(payload)
    except ValidationError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=get_first_validation_message(exc),
        ) from exc

    try:
        cliente = update_cliente(db=db, cliente_id=cliente_id, payload=request_payload)
    except ClienteNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    except ClienteDuplicateError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc
    except ClienteValidationError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

    return cliente_to_response(cliente)
