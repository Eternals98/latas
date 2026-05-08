"""
Transaction service orchestrating business events and their physical cash movements.
Coordinates the Transaction ledger with the Cash ledger for each transaction type.
"""
from __future__ import annotations
from datetime import UTC, datetime
from decimal import Decimal
from uuid import uuid4
from typing import Literal

from sqlalchemy.orm import Session
from sqlalchemy import select

from app.schemas.transactions.base import TransactionCreateRequest, to_money
from app.schemas.transactions.movements import MovementCreateRequest, MovementResponse, movement_transaction_to_response
from app.schemas.transactions.pays import PayCreateRequest, PayResponse
from app.schemas.transactions.returns import ReturnCreateRequest, ReturnResponse
from app.models.audit_log import AuditLog
from app.models.profile import Profile
from app.models.transaction import Transaction
from app.models.transaction_payment import TransactionPayment
from app.models.payment_method import PaymentMethod
from app.services.cash_service import (
    get_open_cash_session_by_date,
    get_cash_balance,
    record_cash_movement,
)


class TransactionValidationError(Exception):
    pass


class TransactionNotFoundError(Exception):
    pass


def _now() -> datetime:
    return datetime.now(UTC)


def _calculate_cash_impact(db: Session, payments: list) -> Decimal:
    """Calculates total amount of a transaction that affects physical cash."""
    payment_ids = [p.payment_method_id for p in payments]
    methods = db.execute(
        select(PaymentMethod).where(PaymentMethod.id.in_(payment_ids))
    ).scalars().all()

    methods_map = {m.id: m for m in methods}
    return sum(
        (to_money(p.amount) for p in payments if methods_map.get(p.payment_method_id) and methods_map[p.payment_method_id].affects_cash),
        start=Decimal("0.00"),
    )


def create_transaction(
    db: Session,
    *,
    payload: TransactionCreateRequest,
    transaction_type: Literal["sale", "movement", "pay", "return"],
    actor: Profile,
    customer_id: str | None = None,
    document_number: str | None = None,
    parent_transaction_id: str | None = None,
    cash_session_id: str | None = None,
) -> Transaction:
    """
    Creates a transaction record and records associated cash movements.
    """
    transaction_id = str(uuid4())
    created_at = _now()

    cash_impact = _calculate_cash_impact(db, payload.payments)
    movement_type = "cash_in" if transaction_type == "sale" else "cash_out"

    try:
        transaction = Transaction(
            id=transaction_id,
            company_id=payload.company_id,
            customer_id=customer_id,
            cash_session_id=cash_session_id if cash_impact > 0 else None,
            transaction_date=payload.transaction_date,
            document_number=document_number,
            description=payload.description,
            transaction_type=transaction_type,
            total_amount=to_money(payload.total_amount),
            status=payload.status,
            payment_terms=payload.payment_terms,
            payment_difference_amount=Decimal("0.00"),
            payment_difference_reason=None,
            created_by=actor.id,
            updated_by=actor.id,
            created_at=created_at,
            updated_at=created_at,
            parent_transaction_id=parent_transaction_id,
        )
        db.add(transaction)
        db.flush()

        for payment in payload.payments:
            db.add(
                TransactionPayment(
                    id=str(uuid4()),
                    transaction_id=transaction_id,
                    payment_method_id=payment.payment_method_id,
                    amount=to_money(payment.amount),
                    created_at=created_at,
                )
            )

        if cash_impact > 0 and cash_session_id:
            record_cash_movement(
                db,
                cash_session_id=cash_session_id,
                movement_date=payload.transaction_date.date(),
                movement_type=movement_type,
                amount=cash_impact,
                description=f"{transaction_type.title()} - {payload.description}",
                actor=actor,
                transaction_id=transaction_id,
            )

        db.add(
            AuditLog(
                id=str(uuid4()),
                entity_name="transactions",
                entity_id=transaction_id,
                action=f"CREATE_{transaction_type.upper()}",
                old_data=None,
                new_data={
                    "transaction_id": transaction_id,
                    "total_amount": f"{to_money(payload.total_amount):.2f}",
                    "type": transaction_type,
                },
                reason=None,
                created_by=actor.id,
                created_at=created_at,
            )
        )
        db.commit()
        return transaction
    except Exception:
        db.rollback()
        raise


def cancel_transaction(
    db: Session,
    *,
    transaction_id: str,
    reason: str,
    impact_cash: bool,
    actor: Profile,
    cash_session_id: str | None = None,
) -> Transaction:
    """
    Cancels a transaction and optionally reverses the cash impact in the ledger.
    """
    transaction = db.get(Transaction, transaction_id)
    if not transaction:
        raise ValueError("Transaction not found")

    transaction.status = "cancelled"
    transaction.cancelled_by = actor.id
    transaction.cancelled_at = _now()
    transaction.cancellation_reason = reason
    transaction.updated_by = actor.id
    transaction.updated_at = _now()

    if impact_cash and cash_session_id:
        payment_rows = db.execute(
            select(TransactionPayment.amount, PaymentMethod.affects_cash)
            .join(PaymentMethod, PaymentMethod.id == TransactionPayment.payment_method_id)
            .where(TransactionPayment.transaction_id == transaction_id)
        ).all()

        cash_amount = sum(
            (to_money(p.amount) for p in payment_rows if p.affects_cash),
            start=Decimal("0.00"),
        )

        if cash_amount > 0:
            # Sale reversal: cash_out. Pay/movement reversal: cash_in.
            movement_type = "cash_out" if transaction.transaction_type == "sale" else "cash_in"
            record_cash_movement(
                db,
                cash_session_id=cash_session_id,
                movement_date=transaction.transaction_date.date(),
                movement_type=movement_type,
                amount=cash_amount,
                description=f"Anulación de {transaction.transaction_type} {transaction.id}",
                actor=actor,
                transaction_id=transaction.id,
            )

    db.add(
        AuditLog(
            id=str(uuid4()),
            entity_name="transactions",
            entity_id=transaction_id,
            action="CANCEL_TRANSACTION",
            old_data=None,
            new_data={"reason": reason, "impact_cash": impact_cash},
            reason=reason,
            created_by=actor.id,
            created_at=_now(),
        )
    )
    db.commit()
    return transaction


def create_movement(
    db: Session,
    *,
    payload: MovementCreateRequest,
    actor: Profile,
) -> Transaction:
    """
    Creates a Movimiento: moves cash from the drawer to the vault.
    Validates that the amount does not exceed the current cash balance.
    Generates cash_out + vault_in cash movements.
    """
    session = get_open_cash_session_by_date(db, session_date=payload.movement_date)
    if session is None:
        raise TransactionValidationError("No se puede registrar el movimiento porque la caja está cerrada para la fecha indicada.")

    current_balance = get_cash_balance(db, payload.movement_date)
    amount = to_money(payload.amount)
    if amount > current_balance:
        raise TransactionValidationError(
            f"El monto del movimiento ({amount:.2f}) supera el saldo disponible en caja ({current_balance:.2f})."
        )

    transaction_id = str(uuid4())
    created_at = _now()

    try:
        transaction = Transaction(
            id=transaction_id,
            company_id=payload.company_id,
            customer_id=None,
            cash_session_id=session.id,
            transaction_date=datetime.combine(payload.movement_date, datetime.min.time(), tzinfo=UTC),
            document_number=None,
            description=payload.description,
            transaction_type="movement",
            total_amount=amount,
            status="confirmed",
            payment_terms="Contado",
            payment_difference_amount=Decimal("0.00"),
            payment_difference_reason=None,
            created_by=actor.id,
            updated_by=actor.id,
            created_at=created_at,
            updated_at=created_at,
            parent_transaction_id=None,
        )
        db.add(transaction)
        db.flush()

        record_cash_movement(
            db,
            cash_session_id=session.id,
            movement_date=payload.movement_date,
            movement_type="cash_out",
            amount=amount,
            description=f"Movimiento - {payload.description}",
            actor=actor,
            transaction_id=transaction_id,
        )
        record_cash_movement(
            db,
            cash_session_id=session.id,
            movement_date=payload.movement_date,
            movement_type="vault_in",
            amount=amount,
            description=f"Movimiento a bóveda - {payload.description}",
            actor=actor,
            transaction_id=transaction_id,
        )

        db.add(
            AuditLog(
                id=str(uuid4()),
                entity_name="transactions",
                entity_id=transaction_id,
                action="CREATE_MOVEMENT",
                old_data=None,
                new_data={"amount": f"{amount:.2f}", "movement_date": payload.movement_date.isoformat()},
                reason=None,
                created_by=actor.id,
                created_at=created_at,
            )
        )
        db.commit()
        return transaction
    except Exception:
        db.rollback()
        raise


def create_pay(
    db: Session,
    *,
    payload: PayCreateRequest,
    actor: Profile,
) -> tuple[Transaction, PaymentMethod]:
    """
    Creates a Pago (expense). Generates cash_out only when the payment method
    affects cash (e.g., efectivo).
    """
    session = get_open_cash_session_by_date(db, session_date=payload.transaction_date.date())
    if session is None:
        raise TransactionValidationError("No se puede registrar el pago porque la caja está cerrada para la fecha indicada.")

    method = db.execute(
        select(PaymentMethod).where(
            PaymentMethod.id == payload.payment_method_id,
            PaymentMethod.is_active.is_(True),
        )
    ).scalars().first()
    if method is None:
        raise TransactionValidationError("El método de pago no existe o está inactivo.")

    amount = to_money(payload.total_amount)
    transaction_id = str(uuid4())
    created_at = _now()
    generates_cash_out = method.affects_cash

    try:
        transaction = Transaction(
            id=transaction_id,
            company_id=payload.company_id,
            customer_id=None,
            cash_session_id=session.id if generates_cash_out else None,
            transaction_date=payload.transaction_date,
            document_number=None,
            description=payload.description,
            transaction_type="pay",
            total_amount=amount,
            status="confirmed",
            payment_terms=payload.payment_terms,
            payment_difference_amount=Decimal("0.00"),
            payment_difference_reason=None,
            created_by=actor.id,
            updated_by=actor.id,
            created_at=created_at,
            updated_at=created_at,
            parent_transaction_id=None,
        )
        db.add(transaction)
        db.flush()

        db.add(
            TransactionPayment(
                id=str(uuid4()),
                transaction_id=transaction_id,
                payment_method_id=method.id,
                amount=amount,
                created_at=created_at,
            )
        )

        if generates_cash_out:
            record_cash_movement(
                db,
                cash_session_id=session.id,
                movement_date=payload.transaction_date.date(),
                movement_type="cash_out",
                amount=amount,
                description=f"Pago - {payload.description}",
                actor=actor,
                transaction_id=transaction_id,
            )

        db.add(
            AuditLog(
                id=str(uuid4()),
                entity_name="transactions",
                entity_id=transaction_id,
                action="CREATE_PAY",
                old_data=None,
                new_data={
                    "amount": f"{amount:.2f}",
                    "payment_method": method.name,
                    "cash_out": generates_cash_out,
                },
                reason=None,
                created_by=actor.id,
                created_at=created_at,
            )
        )
        db.commit()
        return transaction, method
    except Exception:
        db.rollback()
        raise


def create_return(
    db: Session,
    *,
    payload: ReturnCreateRequest,
    actor: Profile,
) -> tuple[Transaction, PaymentMethod]:
    """
    Creates a Devolución (return/refund). Always generates cash_out.
    Validates that the return amount does not exceed the parent transaction total.
    Partial returns are allowed.
    """
    session = get_open_cash_session_by_date(db, session_date=payload.transaction_date.date())
    if session is None:
        raise TransactionValidationError("No se puede registrar la devolución porque la caja está cerrada para la fecha indicada.")

    parent = db.get(Transaction, payload.parent_transaction_id)
    if parent is None or parent.transaction_type not in {"sale", "pay"}:
        raise TransactionValidationError("La transacción padre no existe o no es una venta/pago válido para devolución.")
    if parent.status == "cancelled":
        raise TransactionValidationError("No se puede hacer una devolución sobre una transacción anulada.")

    amount = to_money(payload.amount)
    if amount > to_money(parent.total_amount):
        raise TransactionValidationError(
            f"El monto de devolución ({amount:.2f}) supera el total de la transacción original ({to_money(parent.total_amount):.2f})."
        )

    method = db.execute(
        select(PaymentMethod).where(
            PaymentMethod.id == payload.payment_method_id,
            PaymentMethod.is_active.is_(True),
        )
    ).scalars().first()
    if method is None:
        raise TransactionValidationError("El método de pago de la devolución no existe o está inactivo.")

    transaction_id = str(uuid4())
    created_at = _now()

    try:
        transaction = Transaction(
            id=transaction_id,
            company_id=payload.company_id,
            customer_id=None,
            cash_session_id=session.id,
            transaction_date=payload.transaction_date,
            document_number=None,
            description=payload.description,
            transaction_type="return",
            total_amount=amount,
            status="confirmed",
            payment_terms="Contado",
            payment_difference_amount=Decimal("0.00"),
            payment_difference_reason=None,
            created_by=actor.id,
            updated_by=actor.id,
            created_at=created_at,
            updated_at=created_at,
            parent_transaction_id=payload.parent_transaction_id,
        )
        db.add(transaction)
        db.flush()

        db.add(
            TransactionPayment(
                id=str(uuid4()),
                transaction_id=transaction_id,
                payment_method_id=method.id,
                amount=amount,
                created_at=created_at,
            )
        )

        # Devolución siempre genera cash_out
        record_cash_movement(
            db,
            cash_session_id=session.id,
            movement_date=payload.transaction_date.date(),
            movement_type="cash_out",
            amount=amount,
            description=f"Devolución - {payload.description}",
            actor=actor,
            transaction_id=transaction_id,
        )

        db.add(
            AuditLog(
                id=str(uuid4()),
                entity_name="transactions",
                entity_id=transaction_id,
                action="CREATE_RETURN",
                old_data=None,
                new_data={
                    "amount": f"{amount:.2f}",
                    "parent_transaction_id": payload.parent_transaction_id,
                    "payment_method": method.name,
                },
                reason=None,
                created_by=actor.id,
                created_at=created_at,
            )
        )
        db.commit()
        return transaction, method
    except Exception:
        db.rollback()
        raise
