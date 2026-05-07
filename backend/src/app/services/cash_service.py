from __future__ import annotations

from datetime import UTC, date, datetime
from decimal import Decimal
from uuid import uuid4

from sqlalchemy import and_, func, select
from sqlalchemy.orm import Session

from src.api.schemas.cash import CashMovementRecord, CashSessionRecord, to_money
from src.models.cash_event import CashEvent
from src.models.audit_log import AuditLog
from src.models.cash_movement import CashMovement
from src.models.cash_session import CashSession
from src.models.profile import Profile


class CashValidationError(Exception):
    pass


class CashConflictError(Exception):
    pass


class CashNotFoundError(Exception):
    pass


def _now() -> datetime:
    return datetime.now(UTC)


def _require_admin(actor: Profile) -> None:
    if actor.role != "admin":
        raise CashValidationError("Operación permitida solo para administradores.")


def _require_admin_or_cashier(actor: Profile) -> None:
    if actor.role not in {"admin", "cashier"}:
        raise CashValidationError("Operación no permitida para este usuario.")


def _get_session_by_date(db: Session, session_date: date) -> CashSession | None:
    return (
        db.execute(select(CashSession).where(CashSession.session_date == session_date))
        .scalars()
        .first()
    )


def _get_open_session_or_raise(db: Session, session_date: date) -> CashSession:
    session = _get_session_by_date(db, session_date)
    if session is None:
        raise CashNotFoundError("No existe caja para la fecha indicada.")
    if session.status != "open":
        raise CashConflictError("La caja de la fecha indicada ya está cerrada.")
    return session


def _compute_balances(db: Session, cash_session_id: str, opening_cash: Decimal) -> tuple[Decimal, Decimal]:
    rows = db.execute(
        select(
            CashMovement.movement_type,
            func.coalesce(func.sum(CashMovement.amount), 0).label("total"),
        )
        .where(CashMovement.cash_session_id == cash_session_id)
        .group_by(CashMovement.movement_type)
    ).all()

    totals = {row.movement_type: to_money(row.total) for row in rows}
    cash_balance = to_money(opening_cash)
    cash_balance += totals.get("cash_in", Decimal("0.00"))
    cash_balance -= totals.get("cash_out", Decimal("0.00"))
    cash_balance += totals.get("adjustment_in", Decimal("0.00"))
    cash_balance -= totals.get("adjustment_out", Decimal("0.00"))
    cash_balance -= totals.get("reversal", Decimal("0.00"))
    vault_balance = totals.get("vault_in", Decimal("0.00")) - totals.get("vault_out", Decimal("0.00"))
    return to_money(cash_balance), to_money(vault_balance)


def _session_to_record(db: Session, session: CashSession) -> CashSessionRecord:
    cash_balance, vault_balance = _compute_balances(db, session.id, to_money(session.opening_cash))
    opened_by_label = None
    closed_by_label = None
    if session.opened_by is not None:
        opened_profile = db.get(Profile, session.opened_by)
        opened_by_label = opened_profile.full_name if opened_profile else None
    if session.closed_by is not None:
        closed_profile = db.get(Profile, session.closed_by)
        closed_by_label = closed_profile.full_name if closed_profile else None
    return CashSessionRecord(
        id=session.id,
        session_date=session.session_date,
        status=session.status,
        opening_cash=to_money(session.opening_cash),
        closing_cash_expected=to_money(session.closing_cash_expected) if session.closing_cash_expected is not None else None,
        closing_cash_counted=to_money(session.closing_cash_counted) if session.closing_cash_counted is not None else None,
        difference_amount=to_money(session.difference_amount) if session.difference_amount is not None else None,
        cash_balance=cash_balance,
        vault_balance=vault_balance,
        total_operational_balance=to_money(cash_balance + vault_balance),
        opened_by=session.opened_by,
        opened_by_label=opened_by_label,
        closed_by=session.closed_by,
        closed_by_label=closed_by_label,
        opened_at=session.opened_at,
        closed_at=session.closed_at,
    )


def _log_audit(
    db: Session,
    *,
    action: str,
    entity_id: str,
    actor: Profile,
    reason: str | None,
    new_data: dict | None,
) -> None:
    db.add(
        AuditLog(
            id=str(uuid4()),
            entity_name="cash_sessions",
            entity_id=entity_id,
            action=action,
            old_data=None,
            new_data=new_data,
            reason=reason,
            created_by=actor.id,
            created_at=_now(),
        )
    )


def _record_cash_event(
    db: Session,
    *,
    cash_session_id: str,
    event_type: str,
    actor: Profile,
    payload: dict | None = None,
    note: str | None = None,
) -> None:
    db.add(
        CashEvent(
            id=str(uuid4()),
            cash_session_id=cash_session_id,
            event_type=event_type,
            actor_id=actor.id,
            event_at=_now(),
            payload=payload,
            note=note,
        )
    )


def _first_event_by_type(db: Session, cash_session_id: str, event_type: str) -> CashEvent | None:
    return (
        db.execute(
            select(CashEvent)
            .where(CashEvent.cash_session_id == cash_session_id, CashEvent.event_type == event_type)
            .order_by(CashEvent.event_at.asc(), CashEvent.id.asc())
        )
        .scalars()
        .first()
    )


def _create_movement(
    db: Session,
    *,
    cash_session_id: str,
    movement_date: date,
    movement_type: str,
    amount: Decimal,
    description: str | None,
    actor: Profile,
    transaction_id: str | None = None,
) -> CashMovement:
    movement = CashMovement(
        id=str(uuid4()),
        transaction_id=transaction_id,
        cash_session_id=cash_session_id,
        movement_date=movement_date,
        movement_type=movement_type,
        amount=to_money(amount),
        description=description,
        created_by=actor.id,
        created_at=_now(),
    )
    db.add(movement)
    return movement


def open_cash_session(
    db: Session,
    *,
    session_date: date,
    opening_cash: Decimal,
    actor: Profile,
) -> CashSessionRecord:
    _require_admin_or_cashier(actor)
    existing = _get_session_by_date(db, session_date)
    if existing is not None:
        if actor.role != "admin":
            raise CashConflictError("Ya existe una caja creada para la fecha indicada.")
        if existing.status == "open":
            raise CashConflictError("La caja ya está abierta.")
        existing.status = "open"
        if existing.opened_at is None:
            existing.opened_at = _now()
        _record_cash_event(
            db,
            cash_session_id=existing.id,
            event_type="reopen",
            actor=actor,
            payload={"session_date": session_date.isoformat(), "reopened_at": _now().isoformat()},
            note="Reapertura de caja",
        )
        _log_audit(
            db,
            action="REOPEN_CASH_SESSION",
            entity_id=existing.id,
            actor=actor,
            reason=None,
            new_data={"session_date": session_date.isoformat()},
        )
        db.commit()
        db.refresh(existing)
        return _session_to_record(db, existing)

    opened_at = _now()
    session = CashSession(
        id=str(uuid4()),
        session_date=session_date,
        opening_cash=to_money(opening_cash),
        closing_cash_expected=None,
        closing_cash_counted=None,
        difference_amount=None,
        status="open",
        opened_by=actor.id,
        closed_by=None,
        opened_at=opened_at,
        closed_at=None,
    )
    try:
        db.add(session)
        db.flush()
        _log_audit(
            db,
            action="OPEN_CASH_SESSION",
            entity_id=session.id,
            actor=actor,
            reason=None,
            new_data={"session_date": session_date.isoformat(), "opening_cash": f"{to_money(opening_cash):.2f}"},
        )
        _record_cash_event(
            db,
            cash_session_id=session.id,
            event_type="open",
            actor=actor,
            payload={"session_date": session_date.isoformat(), "opening_cash": f"{to_money(opening_cash):.2f}"},
            note="Apertura de caja",
        )
        db.commit()
        db.refresh(session)
    except Exception:
        db.rollback()
        raise
    return _session_to_record(db, session)


def register_cash_delivery(
    db: Session,
    *,
    movement_date: date,
    amount: Decimal,
    description: str | None,
    actor: Profile,
) -> CashSessionRecord:
    _require_admin_or_cashier(actor)
    session = _get_open_session_or_raise(db, movement_date)
    session_record = _session_to_record(db, session)
    delivery_amount = to_money(amount)
    if session_record.cash_balance < delivery_amount:
        raise CashConflictError("Saldo insuficiente en caja para registrar la entrega.")

    try:
        _create_movement(
            db,
            cash_session_id=session.id,
            movement_date=movement_date,
            movement_type="cash_out",
            amount=delivery_amount,
            description=description or "Entrega de efectivo desde caja",
            actor=actor,
        )
        _create_movement(
            db,
            cash_session_id=session.id,
            movement_date=movement_date,
            movement_type="vault_in",
            amount=delivery_amount,
            description=description or "Ingreso de efectivo a bóveda",
            actor=actor,
        )
        _log_audit(
            db,
            action="CREATE_CASH_DELIVERY",
            entity_id=session.id,
            actor=actor,
            reason=None,
            new_data={"amount": f"{delivery_amount:.2f}", "movement_date": movement_date.isoformat()},
        )
        _record_cash_event(
            db,
            cash_session_id=session.id,
            event_type="delivery",
            actor=actor,
            payload={"amount": f"{delivery_amount:.2f}", "movement_date": movement_date.isoformat()},
            note=description or "Entrega de efectivo desde caja",
        )
        db.commit()
        db.refresh(session)
    except Exception:
        db.rollback()
        raise
    return _session_to_record(db, session)


def register_manual_adjustment(
    db: Session,
    *,
    movement_date: date,
    direction: str,
    amount: Decimal,
    reason: str,
    description: str | None,
    actor: Profile,
) -> CashSessionRecord:
    _require_admin(actor)
    session = _get_open_session_or_raise(db, movement_date)
    movement_type = "adjustment_in" if direction == "in" else "adjustment_out"
    adjustment_amount = to_money(amount)
    if movement_type == "adjustment_out":
        session_record = _session_to_record(db, session)
        if session_record.cash_balance < adjustment_amount:
            raise CashConflictError("Saldo insuficiente en caja para ajuste de salida.")

    try:
        _create_movement(
            db,
            cash_session_id=session.id,
            movement_date=movement_date,
            movement_type=movement_type,
            amount=adjustment_amount,
            description=description or reason,
            actor=actor,
        )
        _log_audit(
            db,
            action="CREATE_MANUAL_ADJUSTMENT",
            entity_id=session.id,
            actor=actor,
            reason=reason,
            new_data={
                "direction": direction,
                "amount": f"{adjustment_amount:.2f}",
                "movement_date": movement_date.isoformat(),
            },
        )
        db.commit()
        db.refresh(session)
    except Exception:
        db.rollback()
        raise
    return _session_to_record(db, session)


def register_vault_withdrawal(
    db: Session,
    *,
    movement_date: date,
    amount: Decimal,
    description: str | None,
    actor: Profile,
) -> CashSessionRecord:
    _require_admin_or_cashier(actor)
    session = _get_open_session_or_raise(db, movement_date)
    session_record = _session_to_record(db, session)
    withdrawal_amount = to_money(amount)
    if session_record.vault_balance < withdrawal_amount:
        raise CashConflictError("Saldo insuficiente en bóveda para registrar el retiro.")

    try:
        _create_movement(
            db,
            cash_session_id=session.id,
            movement_date=movement_date,
            movement_type="vault_out",
            amount=withdrawal_amount,
            description=description or "Retiro desde bóveda",
            actor=actor,
        )
        _log_audit(
            db,
            action="CREATE_VAULT_WITHDRAWAL",
            entity_id=session.id,
            actor=actor,
            reason=None,
            new_data={"amount": f"{withdrawal_amount:.2f}", "movement_date": movement_date.isoformat()},
        )
        _record_cash_event(
            db,
            cash_session_id=session.id,
            event_type="vault_out",
            actor=actor,
            payload={"amount": f"{withdrawal_amount:.2f}", "movement_date": movement_date.isoformat()},
            note=description or "Retiro desde bóveda",
        )
        db.commit()
        db.refresh(session)
    except Exception:
        db.rollback()
        raise
    return _session_to_record(db, session)


def close_cash_session(
    db: Session,
    *,
    session_date: date,
    counted_cash: Decimal,
    actor: Profile,
) -> CashSessionRecord:
    _require_admin_or_cashier(actor)
    session = _get_open_session_or_raise(db, session_date)
    session_record = _session_to_record(db, session)
    if actor.role == "cashier" and _first_event_by_type(db, session.id, "close") is not None:
        raise CashConflictError("El usuario de caja ya cerró esta sesión.")
    expected = to_money(session_record.cash_balance)
    counted = to_money(counted_cash)
    difference = to_money(counted - expected)
    now = _now()

    try:
        session.closing_cash_expected = expected
        session.closing_cash_counted = counted
        session.difference_amount = difference
        session.status = "closed"
        session.closed_by = actor.id
        if session.closed_at is None:
            session.closed_at = now
        _log_audit(
            db,
            action="CLOSE_CASH_SESSION",
            entity_id=session.id,
            actor=actor,
            reason=None,
            new_data={
                "expected": f"{expected:.2f}",
                "counted": f"{counted:.2f}",
                "difference": f"{difference:.2f}",
            },
        )
        _record_cash_event(
            db,
            cash_session_id=session.id,
            event_type="close",
            actor=actor,
            payload={
                "expected": f"{expected:.2f}",
                "counted": f"{counted:.2f}",
                "difference": f"{difference:.2f}",
            },
            note="Cierre de caja con diferencia" if difference != 0 else "Cierre de caja",
        )
        db.commit()
        db.refresh(session)
    except Exception:
        db.rollback()
        raise
    return _session_to_record(db, session)


def get_today_cash_status(
    db: Session,
    *,
    session_date: date,
) -> tuple[CashSessionRecord, list[CashMovementRecord]]:
    session = _get_session_by_date(db, session_date)
    if session is None:
        raise CashNotFoundError("No existe caja para la fecha indicada.")

    rows = db.execute(
        select(CashMovement)
        .where(CashMovement.cash_session_id == session.id)
        .order_by(CashMovement.created_at.asc(), CashMovement.id.asc())
    ).scalars().all()
    movements = [
        CashMovementRecord(
            id=row.id,
            transaction_id=row.transaction_id,
            movement_date=row.movement_date,
            movement_type=row.movement_type,
            amount=to_money(row.amount),
            description=row.description,
            created_by=row.created_by,
            created_at=row.created_at,
        )
        for row in rows
    ]
    return _session_to_record(db, session), movements


def list_cash_history(
    db: Session,
    *,
    date_from: date | None,
    date_to: date | None,
    status: str | None,
) -> tuple[list[CashSessionRecord], int]:
    conditions = []
    if date_from is not None:
        conditions.append(CashSession.session_date >= date_from)
    if date_to is not None:
        conditions.append(CashSession.session_date <= date_to)
    if status is not None:
        if status not in {"open", "closed"}:
            raise CashValidationError("status debe ser open o closed.")
        conditions.append(CashSession.status == status)

    where_clause = and_(*conditions) if conditions else None
    query = select(CashSession)
    count_query = select(func.count()).select_from(CashSession)
    if where_clause is not None:
        query = query.where(where_clause)
        count_query = count_query.where(where_clause)

    sessions = db.execute(query.order_by(CashSession.session_date.desc())).scalars().all()
    total = int(db.execute(count_query).scalar_one())
    return ([_session_to_record(db, item) for item in sessions], total)


def list_cash_events(
    db: Session,
    *,
    date_from: date | None,
    date_to: date | None,
) -> tuple[list[tuple[CashEvent, CashSession, Profile | None]], int]:
    query = (
        select(CashEvent, CashSession, Profile)
        .join(CashSession, CashSession.id == CashEvent.cash_session_id)
        .join(Profile, Profile.id == CashEvent.actor_id, isouter=True)
    )
    count_query = select(func.count()).select_from(CashEvent)
    conditions = []
    if date_from is not None:
        conditions.append(CashSession.session_date >= date_from)
    if date_to is not None:
        conditions.append(CashSession.session_date <= date_to)
    where_clause = and_(*conditions) if conditions else None
    if where_clause is not None:
        query = query.where(where_clause)
        count_query = count_query.join(CashSession, CashSession.id == CashEvent.cash_session_id).where(where_clause)
    rows = db.execute(query.order_by(CashSession.session_date.desc(), CashEvent.event_at.desc(), CashEvent.id.desc())).all()
    total = int(db.execute(count_query).scalar_one())
    return rows, total


def get_open_cash_session_by_date(db: Session, *, session_date: date) -> CashSession | None:
    session = _get_session_by_date(db, session_date)
    if session is None or session.status != "open":
        return None
    return session
