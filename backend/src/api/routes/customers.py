from fastapi import APIRouter, Depends, Query
from sqlalchemy import or_
from sqlalchemy.orm import Session

from src.api.schemas.phase1 import CustomerResponse
from src.db.session import get_db
from src.models.customer import Customer
from src.models.profile import Profile
from src.services.supabase_auth import require_user

router = APIRouter(prefix="/api/customers", tags=["Customers"])


@router.get("", response_model=list[CustomerResponse])
def list_customers(
    search: str | None = Query(default=None),
    _: Profile = Depends(require_user),
    db: Session = Depends(get_db),
) -> list[CustomerResponse]:
    query = db.query(Customer).filter(Customer.is_active.is_(True))
    if search:
        pattern = f"%{search.strip()}%"
        query = query.filter(or_(Customer.name.ilike(pattern), Customer.phone.ilike(pattern)))
    rows = query.order_by(Customer.name.asc()).limit(50).all()
    return [CustomerResponse.model_validate(row, from_attributes=True) for row in rows]
