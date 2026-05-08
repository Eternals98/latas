"""
Pay endpoints.
A Pago registers an expense payment. Generates cash_out only when the payment
method affects cash (efectivo).
"""
from datetime import datetime
from decimal import Decimal, ROUND_HALF_UP
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.schemas.transactions.pays import PayCreateRequest, PayResponse
from app.schemas.transactions.base import ErrorResponse
from app.core.database import get_db
from app.models.profile import Profile
from app.services.transaction_service import TransactionValidationError, create_pay
from app.services.supabase_auth import require_user

MONEY_QUANT = Decimal("0.01")

router = APIRouter(prefix="/pays", tags=["Pays"])


@router.post(
    "",
    response_model=PayResponse,
    status_code=status.HTTP_201_CREATED,
    responses={
        status.HTTP_400_BAD_REQUEST: {"model": ErrorResponse},
        status.HTTP_409_CONFLICT: {"model": ErrorResponse},
    },
)
def create_pay_route(
    payload: PayCreateRequest,
    actor: Profile = Depends(require_user),
    db: Session = Depends(get_db),
) -> PayResponse:
    transaction, method = create_pay(db, payload=payload, actor=actor)
    return PayResponse(
        id=transaction.id,
        company_id=transaction.company_id,
        transaction_date=transaction.transaction_date.isoformat() if isinstance(transaction.transaction_date, datetime) else str(transaction.transaction_date),
        description=transaction.description,
        total_amount=Decimal(str(transaction.total_amount)).quantize(MONEY_QUANT),
        payment_method_id=method.id,
        payment_method_name=method.name,
        payment_terms=transaction.payment_terms,
        status=transaction.status,
        transaction_type=transaction.transaction_type,
        cash_impact=method.affects_cash,
        created_at=transaction.created_at.isoformat() if isinstance(transaction.created_at, datetime) else str(transaction.created_at),
    )
