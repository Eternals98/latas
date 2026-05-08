"""
Transaction service orchestrating business events and their physical cash movements.
Acts as the coordinator between the Transaction ledger and the Cash ledger.
"""
from __future__ import annotations
from datetime import UTC, datetime
from decimal import Decimal
from uuid import uuid4
from typing import Literal

from sqlalchemy.orm import Session
from src.app.schemas.transactions.base import TransactionCreateRequest, to_money
from src.models.audit_log import AuditLog
from src.models.profile import Profile
from src.models.transaction import Transaction
from src.models.transaction_payment import TransactionPayment
from src.models.payment_method import PaymentMethod
from sqlalchemy import select
from src.app.services.cash_service import record_cash_movement

def _now() -> datetime:
    """Returns current UTC datetime."""
    return datetime.now(UTC)

def _calculate_cash_impact(db: Session, payments: list) -> Decimal:
    """Calculates total amount of a transaction that affects physical cash."""
    payment_ids = [p.payment_method_id for p in payments]
    methods = db.execute(
        select(PaymentMethod).where(PaymentMethod.id.in_(payment_ids))
    ).scalars().all()
    
    methods_map = {m.id: m for m in methods}
    cash_total = sum(
        (to_money(p.amount) for p in payments if methods_map.get(p.payment_method_id).affects_cash),
        start=Decimal("0.00")
    )
    return cash_total

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
    Creates a transaction and automatically records associated cash movements.
    Coordinates the creation of the transaction header, payments, and cash ledger entries.
    """
    transaction_id = str(uuid4())
    created_at = _now()
    
    cash_impact = _calculate_cash_impact(db, payload.payments)
    
    # Determine the cash movement type based on the transaction type
    # sale -> cash_in, movement (to vault) -> cash_out, pay -> cash_out, return -> cash_out
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
    Updates the transaction status and records a corresponding cash movement if requested.
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
        # Calculate how much cash was actually involved in this transaction
        payment_rows = db.execute(
            select(TransactionPayment.amount, PaymentMethod.affects_cash)
            .join(PaymentMethod, PaymentMethod.id == TransactionPayment.payment_method_id)
            .where(TransactionPayment.transaction_id == transaction_id)
        ).all()
        
        cash_amount = sum(
            (to_money(p.amount) for p in payment_rows if p.affects_cash),
            start=Decimal("0.00")
        )
        
        if cash_amount > 0:
            # For a sale (cash_in), cancellation is a cash_out.
            # For a pay/movement (cash_out), cancellation is a cash_in.
            movement_type = "cash_out" if transaction.transaction_type == "sale" else "cash_in"
            
            record_cash_movement(
                db,
                cash_session_id=cash_session_id,
                movement_date=transaction.transaction_date.date(),
                movement_type=movement_type,
                amount=cash_amount,
                description=f"Cancellation of {transaction.transaction_type} {transaction.id}",
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
