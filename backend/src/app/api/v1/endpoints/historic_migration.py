"""
Historic Migration endpoints.
Allows administrators to import legacy sales data from Excel files.
"""
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.schemas.historic_migration import HistoricMigrationResponse
from app.core.database import get_db
from app.models.profile import Profile
from app.services.historic_migration_service import HistoricMigrationError, migrate_historic_excel
from app.services.supabase_auth import require_admin

router = APIRouter(prefix="/admin/historic-migration", tags=["HistoricMigration"])

@router.post(
    "",
    response_model=HistoricMigrationResponse,
    responses={status.HTTP_400_BAD_REQUEST: {"description": "Invalid file"}},
)
async def upload_historic_migration(
    file: UploadFile = File(...),
    month: str | None = Form(None),
    actor: Profile = Depends(require_admin),
    db: Session = Depends(get_db),
) -> HistoricMigrationResponse:
    """
    Uploads and processes an Excel file containing legacy sales data.
    Validates the file content and imports records into the transactions table.
    """
    content = await file.read()
    try:
        return migrate_historic_excel(db, content=content, actor=actor, filename=file.filename, month=month)
    except HistoricMigrationError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
