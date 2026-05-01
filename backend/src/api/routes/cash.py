from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from src.api.schemas.cash import (
    CashActionRequest,
    CashAdjustmentRequest,
    CashCloseRequest,
    CashHistoryResponse,
    CashOpenRequest,
    CashSessionDetailResponse,
    CashSessionResponse,
    ErrorResponse,
    cash_movement_record_to_response,
    cash_session_record_to_response,
)
from src.db.session import get_db
from src.models.profile import Profile
from src.services.cash_service import (
    CashConflictError,
    CashNotFoundError,
    CashValidationError,
    close_cash_session,
    get_today_cash_status,
    list_cash_history,
    open_cash_session,
    register_cash_delivery,
    register_manual_adjustment,
    register_vault_withdrawal,
)
from src.services.supabase_auth import require_user

router = APIRouter(prefix="/api/cash", tags=["Cash"])


@router.post("/open", response_model=CashSessionResponse, responses={400: {"model": ErrorResponse}, 403: {"model": ErrorResponse}, 409: {"model": ErrorResponse}})
def open_cash_route(
    payload: CashOpenRequest,
    actor: Profile = Depends(require_user),
    db: Session = Depends(get_db),
) -> CashSessionResponse:
    try:
        record = open_cash_session(db, session_date=payload.session_date, opening_cash=payload.opening_cash, actor=actor)
        return cash_session_record_to_response(record)
    except CashValidationError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc)) from exc
    except CashConflictError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc


@router.post("/delivery", response_model=CashSessionResponse, responses={400: {"model": ErrorResponse}, 404: {"model": ErrorResponse}, 409: {"model": ErrorResponse}})
def cash_delivery_route(
    payload: CashActionRequest,
    actor: Profile = Depends(require_user),
    db: Session = Depends(get_db),
) -> CashSessionResponse:
    try:
        record = register_cash_delivery(
            db,
            movement_date=payload.movement_date,
            amount=payload.amount,
            description=payload.description,
            actor=actor,
        )
        return cash_session_record_to_response(record)
    except CashNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    except CashConflictError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc


@router.post("/vault-withdrawal", response_model=CashSessionResponse, responses={403: {"model": ErrorResponse}, 404: {"model": ErrorResponse}, 409: {"model": ErrorResponse}})
def vault_withdrawal_route(
    payload: CashActionRequest,
    actor: Profile = Depends(require_user),
    db: Session = Depends(get_db),
) -> CashSessionResponse:
    try:
        record = register_vault_withdrawal(
            db,
            movement_date=payload.movement_date,
            amount=payload.amount,
            description=payload.description,
            actor=actor,
        )
        return cash_session_record_to_response(record)
    except CashValidationError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc)) from exc
    except CashNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    except CashConflictError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc


@router.post("/adjustment", response_model=CashSessionResponse, responses={403: {"model": ErrorResponse}, 404: {"model": ErrorResponse}, 409: {"model": ErrorResponse}})
def adjustment_route(
    payload: CashAdjustmentRequest,
    actor: Profile = Depends(require_user),
    db: Session = Depends(get_db),
) -> CashSessionResponse:
    try:
        record = register_manual_adjustment(
            db,
            movement_date=payload.movement_date,
            direction=payload.direction,
            amount=payload.amount,
            reason=payload.reason,
            description=payload.description,
            actor=actor,
        )
        return cash_session_record_to_response(record)
    except CashValidationError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc)) from exc
    except CashNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    except CashConflictError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc


@router.post("/close", response_model=CashSessionResponse, responses={403: {"model": ErrorResponse}, 404: {"model": ErrorResponse}, 409: {"model": ErrorResponse}})
def close_cash_route(
    payload: CashCloseRequest,
    actor: Profile = Depends(require_user),
    db: Session = Depends(get_db),
) -> CashSessionResponse:
    try:
        record = close_cash_session(db, session_date=payload.session_date, counted_cash=payload.counted_cash, actor=actor)
        return cash_session_record_to_response(record)
    except CashValidationError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc)) from exc
    except CashNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    except CashConflictError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc


@router.get("/today", response_model=CashSessionDetailResponse, responses={404: {"model": ErrorResponse}})
def cash_today_route(
    session_date: str = Query(..., description="YYYY-MM-DD"),
    _: Profile = Depends(require_user),
    db: Session = Depends(get_db),
) -> CashSessionDetailResponse:
    try:
        parsed = date.fromisoformat(session_date)
        session, movements = get_today_cash_status(db, session_date=parsed)
        return CashSessionDetailResponse(
            session=cash_session_record_to_response(session),
            movements=[cash_movement_record_to_response(item) for item in movements],
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="session_date debe tener formato YYYY-MM-DD.") from exc
    except CashNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


@router.get("/history", response_model=CashHistoryResponse, responses={400: {"model": ErrorResponse}})
def cash_history_route(
    date_from: str | None = Query(default=None),
    date_to: str | None = Query(default=None),
    status_filter: str | None = Query(default=None, alias="status"),
    _: Profile = Depends(require_user),
    db: Session = Depends(get_db),
) -> CashHistoryResponse:
    try:
        parsed_from = date.fromisoformat(date_from) if date_from else None
        parsed_to = date.fromisoformat(date_to) if date_to else None
        if parsed_from and parsed_to and parsed_to < parsed_from:
            raise CashValidationError("date_to debe ser mayor o igual a date_from.")
        records, total = list_cash_history(db, date_from=parsed_from, date_to=parsed_to, status=status_filter)
        return CashHistoryResponse(items=[cash_session_record_to_response(item) for item in records], total=total)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="date_from/date_to deben tener formato YYYY-MM-DD.") from exc
    except CashValidationError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
