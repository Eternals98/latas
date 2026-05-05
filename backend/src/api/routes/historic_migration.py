from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from src.api.schemas.historic_migration import HistoricMigrationResponse
from src.db.session import get_db
from src.models.profile import Profile
from src.services.historic_migration_service import HistoricMigrationError, migrate_historic_excel
from src.services.supabase_auth import require_admin

router = APIRouter(prefix="/api/admin/historic-migration", tags=["HistoricMigration"])


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
    content = await file.read()
    try:
        return migrate_historic_excel(db, content=content, actor=actor, filename=file.filename, month=month)
    except HistoricMigrationError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
