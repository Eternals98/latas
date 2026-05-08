"""
Payment Methods endpoints.
Provides read access to the catalog of available payment types.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.schemas.phase1 import PaymentMethodResponse
from app.core.database import get_db
from app.models.payment_method import PaymentMethod
from app.models.profile import Profile
from app.services.supabase_auth import require_user

router = APIRouter(prefix="/payment-methods", tags=["PaymentMethods"])

@router.get("", response_model=list[PaymentMethodResponse])
def list_payment_methods(
    _: Profile = Depends(require_user),
    db: Session = Depends(get_db),
) -> list[PaymentMethodResponse]:
    """
    Retrieves a list of all active payment methods.
    Returns them sorted by name in ascending order.
    """
    rows = db.query(PaymentMethod).filter(PaymentMethod.is_active.is_(True)).order_by(PaymentMethod.name.asc()).all()
    return [PaymentMethodResponse.model_validate(row, from_attributes=True) for row in rows]
