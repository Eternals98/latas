"""
Movement endpoints.
A Movimiento transfers cash from the drawer to the vault (cash_out + vault_in).
"""
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.schemas.transactions.movements import MovementCreateRequest, MovementResponse, movement_transaction_to_response
from app.schemas.transactions.base import ErrorResponse
from app.core.database import get_db
from app.models.profile import Profile
from app.services.transaction_service import TransactionValidationError, create_movement
from app.services.supabase_auth import require_user

router = APIRouter(prefix="/movements", tags=["Movements"])


@router.post(
    "",
    response_model=MovementResponse,
    status_code=status.HTTP_201_CREATED,
    responses={
        status.HTTP_400_BAD_REQUEST: {"model": ErrorResponse},
        status.HTTP_409_CONFLICT: {"model": ErrorResponse},
    },
)
def create_movement_route(
    payload: MovementCreateRequest,
    actor: Profile = Depends(require_user),
    db: Session = Depends(get_db),
) -> MovementResponse:
    transaction = create_movement(db, payload=payload, actor=actor)
    return movement_transaction_to_response(transaction)
