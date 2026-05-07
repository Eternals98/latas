from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.schemas.phase1 import CompanyResponse
from app.core.database import get_db
from app.models.company import Company
from app.models.profile import Profile
from app.services.supabase_auth import require_user

router = APIRouter(prefix="/companies", tags=["Companies"])


@router.get("", response_model=list[CompanyResponse])
def list_companies(
    _: Profile = Depends(require_user),
    db: Session = Depends(get_db),
) -> list[CompanyResponse]:
    rows = db.query(Company).order_by(Company.name.asc()).all()
    return [CompanyResponse.model_validate(row, from_attributes=True) for row in rows]
