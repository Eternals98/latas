from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from src.api.schemas.phase1 import CompanyResponse
from src.db.session import get_db
from src.models.company import Company
from src.models.profile import Profile
from src.services.supabase_auth import require_user

router = APIRouter(prefix="/api/companies", tags=["Companies"])


@router.get("", response_model=list[CompanyResponse])
def list_companies(
    _: Profile = Depends(require_user),
    db: Session = Depends(get_db),
) -> list[CompanyResponse]:
    rows = db.query(Company).order_by(Company.name.asc()).all()
    return [CompanyResponse.model_validate(row, from_attributes=True) for row in rows]
