"""
Dashboard endpoints.
Provides aggregated financial metrics and analytics for administrators.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.schemas.dashboard import DashboardResponse
from app.core.database import get_db
from app.services.dashboard_service import get_dashboard
from app.services.supabase_auth import require_user
from app.models.profile import Profile

router = APIRouter(prefix="/dashboard", tags=["Reportes"])

@router.get("", response_model=DashboardResponse)
def read_dashboard(_: Profile = Depends(require_user), db: Session = Depends(get_db)) -> DashboardResponse:
    """
    Retrieves aggregated metrics for the dashboard.
    Includes sales totals, averages, and breakdowns by company and payment method.
    """
    return get_dashboard(db)
