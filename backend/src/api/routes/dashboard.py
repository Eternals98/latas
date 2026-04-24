from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from src.api.schemas.dashboard import DashboardResponse
from src.db.session import get_db
from src.services.dashboard_service import get_dashboard

router = APIRouter(prefix="/api/dashboard", tags=["Reportes"])


@router.get("", response_model=DashboardResponse)
def read_dashboard(db: Session = Depends(get_db)) -> DashboardResponse:
    return get_dashboard(db)
