from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.schemas.cash.session import (
    CashCloseRequest,
    CashOpenRequest,
    CashSessionResponse,
    CashSessionDetailResponse,
    CashHistoryResponse,
    cash_session_record_to_response,
)
from app.schemas.cash.movement import (
    CashActionRequest,
    CashAdjustmentRequest,
    CashEventHistoryResponse,
    CashEventItem,
    CashEventRecord,
    cash_movement_record_to_response,
    cash_event_record_to_response,
)
from app.schemas.transactions.base import ErrorResponse
from app.core.database import get_db
from app.models.profile import Profile
from app.services.cash_service import (
    CashConflictError,
    CashNotFoundError,
    CashValidationError,
    close_cash_session,
    get_today_cash_status,
    list_cash_history,
    list_cash_events,
    open_cash_session,
    register_cash_delivery,
    register_manual_adjustment,
)
from app.services.supabase_auth import require_user

router = APIRouter(prefix="/cash", tags=["Cash"])


@router.post("/open", response_model=CashSessionResponse, responses={400: {"model": ErrorResponse}, 403: {"model": ErrorResponse}, 409: {"model": ErrorResponse}})
def open_cash_route(
    payload: CashOpenRequest,
    actor: Profile = Depends(require_user),
    db: Session = Depends(get_db),
) -> CashSessionResponse:
    record = open_cash_session(db, session_date=payload.session_date, opening_cash=payload.opening_cash, actor=actor)
    return cash_session_record_to_response(record)


@router.post("/delivery", response_model=CashSessionResponse, responses={400: {"model": ErrorResponse}, 404: {"model": ErrorResponse}, 409: {"model": ErrorResponse}})
def cash_delivery_route(
    payload: CashActionRequest,
    actor: Profile = Depends(require_user),
    db: Session = Depends(get_db),
) -> CashSessionResponse:
    record = register_cash_delivery(
        db,
        movement_date=payload.movement_date,
        amount=payload.amount,
        description=payload.description,
        actor=actor,
    )
    return cash_session_record_to_response(record)


@router.post("/adjustment", response_model=CashSessionResponse, responses={403: {"model": ErrorResponse}, 404: {"model": ErrorResponse}, 409: {"model": ErrorResponse}})
def adjustment_route(
    payload: CashAdjustmentRequest,
    actor: Profile = Depends(require_user),
    db: Session = Depends(get_db),
) -> CashSessionResponse:
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


@router.post("/close", response_model=CashSessionResponse, responses={403: {"model": ErrorResponse}, 404: {"model": ErrorResponse}, 409: {"model": ErrorResponse}})
def close_cash_route(
    payload: CashCloseRequest,
    actor: Profile = Depends(require_user),
    db: Session = Depends(get_db),
) -> CashSessionResponse:
    record = close_cash_session(db, session_date=payload.session_date, counted_cash=payload.counted_cash, actor=actor)
    return cash_session_record_to_response(record)


@router.get("/today", response_model=CashSessionDetailResponse, responses={404: {"model": ErrorResponse}})
def cash_today_route(
    session_date: date = Query(..., description="YYYY-MM-DD"),
    _: Profile = Depends(require_user),
    db: Session = Depends(get_db),
) -> CashSessionDetailResponse:
    session, movements = get_today_cash_status(db, session_date=session_date)
    return CashSessionDetailResponse(
        session=cash_session_record_to_response(session),
        movements=[cash_movement_record_to_response(item) for item in movements],
    )


@router.get("/history", response_model=CashHistoryResponse, responses={400: {"model": ErrorResponse}})
def cash_history_route(
    date_from: date | None = Query(default=None),
    date_to: date | None = Query(default=None),
    status_filter: str | None = Query(default=None, alias="status"),
    _: Profile = Depends(require_user),
    db: Session = Depends(get_db),
) -> CashHistoryResponse:
    if date_from and date_to and date_to < date_from:
        raise CashValidationError("date_to debe ser mayor o igual a date_from.")
    records, total = list_cash_history(db, date_from=date_from, date_to=date_to, status=status_filter)
    return CashHistoryResponse(items=[cash_session_record_to_response(item) for item in records], total=total)


@router.get("/events", response_model=CashEventHistoryResponse, responses={400: {"model": ErrorResponse}})
def cash_events_route(
    date_from: date | None = Query(default=None),
    date_to: date | None = Query(default=None),
    _: Profile = Depends(require_user),
    db: Session = Depends(get_db),
) -> CashEventHistoryResponse:
    if date_from and date_to and date_to < date_from:
        raise CashValidationError("date_to debe ser mayor o igual a date_from.")
    rows, total = list_cash_events(db, date_from=date_from, date_to=date_to)
    items: list[CashEventItem] = []
    for event, _session, actor in rows:
        items.append(
            cash_event_record_to_response(
                CashEventRecord(
                    id=event.id,
                    cash_session_id=event.cash_session_id,
                    event_type=event.event_type,
                    actor_id=event.actor_id,
                    actor_label=actor.full_name if actor else None,
                    event_at=event.event_at,
                    payload=event.payload,
                    note=event.note,
                )
            )
        )
    return CashEventHistoryResponse(items=items, total=total)
