from fastapi import APIRouter, Depends, HTTPException, Query, status
from datetime import date
from sqlalchemy.orm import Session

from src.api.schemas.sales import (
    ErrorResponse,
    SaleCreateRequest,
    SaleListFilters,
    SaleResponse,
    SalesListResponse,
    sale_record_to_response,
)
from src.db.session import get_db
from src.models.profile import Profile
from src.services.sales_service import (
    SalesConflictError,
    SalesNotFoundError,
    SalesValidationError,
    create_sale,
    get_sale_by_id,
    list_sales,
)
from src.services.supabase_auth import require_user

router = APIRouter(prefix="/api/sales", tags=["Sales"])


@router.post(
    "",
    response_model=SaleResponse,
    status_code=status.HTTP_201_CREATED,
    responses={
        status.HTTP_400_BAD_REQUEST: {"model": ErrorResponse},
        status.HTTP_409_CONFLICT: {"model": ErrorResponse},
    },
)
def create_sale_route(
    payload: SaleCreateRequest,
    actor: Profile = Depends(require_user),
    db: Session = Depends(get_db),
) -> SaleResponse:
    try:
        record = create_sale(db, payload=payload, actor=actor)
    except SalesValidationError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    except SalesConflictError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc
    return sale_record_to_response(record)


@router.get(
    "",
    response_model=SalesListResponse,
    responses={status.HTTP_400_BAD_REQUEST: {"model": ErrorResponse}},
)
def list_sales_route(
    date_from: date | None = Query(default=None),
    date_to: date | None = Query(default=None),
    company_id: str | None = Query(default=None),
    search: str | None = Query(default=None),
    limit: int = Query(default=50),
    offset: int = Query(default=0),
    _: Profile = Depends(require_user),
    db: Session = Depends(get_db),
) -> SalesListResponse:
    try:
        filters = SaleListFilters(
            date_from=date_from,
            date_to=date_to,
            company_id=company_id,
            search=search,
            limit=limit,
            offset=offset,
        )
        items, total = list_sales(db, filters=filters)
    except SalesValidationError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

    return SalesListResponse(
        items=[sale_record_to_response(item) for item in items],
        total=total,
        limit=filters.limit,
        offset=filters.offset,
    )


@router.get(
    "/{sale_id}",
    response_model=SaleResponse,
    responses={
        status.HTTP_400_BAD_REQUEST: {"model": ErrorResponse},
        status.HTTP_404_NOT_FOUND: {"model": ErrorResponse},
    },
)
def get_sale_route(
    sale_id: str,
    _: Profile = Depends(require_user),
    db: Session = Depends(get_db),
) -> SaleResponse:
    try:
        record = get_sale_by_id(db, sale_id=sale_id)
    except SalesNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    except SalesValidationError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    return sale_record_to_response(record)
