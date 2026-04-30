from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from src.api.schemas.phase1 import PaymentMethodResponse
from src.db.session import get_db
from src.models.payment_method import PaymentMethod
from src.models.profile import Profile
from src.services.supabase_auth import require_user

router = APIRouter(prefix="/api/payment-methods", tags=["PaymentMethods"])


@router.get("", response_model=list[PaymentMethodResponse])
def list_payment_methods(
    _: Profile = Depends(require_user),
    db: Session = Depends(get_db),
) -> list[PaymentMethodResponse]:
    rows = db.query(PaymentMethod).filter(PaymentMethod.is_active.is_(True)).order_by(PaymentMethod.name.asc()).all()
    return [PaymentMethodResponse.model_validate(row, from_attributes=True) for row in rows]
