"""
Return endpoints.
A Devolución always generates a cash_out and must reference a parent transaction.
Partial returns are allowed.
"""
from datetime import datetime
from decimal import Decimal, ROUND_HALF_UP
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.schemas.transactions.returns import ReturnCreateRequest, ReturnResponse
from app.schemas.transactions.base import ErrorResponse
from app.core.database import get_db
from app.models.profile import Profile
from app.services.transaction_service import TransactionValidationError, create_return
from app.services.supabase_auth import require_user

MONEY_QUANT = Decimal("0.01")

router = APIRouter(prefix="/returns", tags=["Returns"])


@router.post(
    "",
    response_model=ReturnResponse,
    status_code=status.HTTP_201_CREATED,
    responses={
        status.HTTP_400_BAD_REQUEST: {"model": ErrorResponse},
        status.HTTP_409_CONFLICT: {"model": ErrorResponse},
    },
)
def create_return_route(
    payload: ReturnCreateRequest,
    actor: Profile = Depends(require_user),
    db: Session = Depends(get_db),
) -> ReturnResponse:
    transaction, method = create_return(db, payload=payload, actor=actor)
    return ReturnResponse(
        id=transaction.id,
        company_id=transaction.company_id,
        parent_transaction_id=transaction.parent_transaction_id,
        transaction_date=transaction.transaction_date.isoformat() if isinstance(transaction.transaction_date, datetime) else str(transaction.transaction_date),
        description=transaction.description,
        amount=Decimal(str(transaction.total_amount)).quantize(MONEY_QUANT),
        payment_method_id=method.id,
        payment_method_name=method.name,
        status=transaction.status,
        transaction_type=transaction.transaction_type,
        created_at=transaction.created_at.isoformat() if isinstance(transaction.created_at, datetime) else str(transaction.created_at),
    )
