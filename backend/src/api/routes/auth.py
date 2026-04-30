from fastapi import APIRouter, Depends

from src.api.schemas.phase1 import ProfileResponse
from src.models.profile import Profile
from src.services.supabase_auth import require_user

router = APIRouter(prefix="/api/auth", tags=["Auth"])


@router.get("/me", response_model=ProfileResponse)
def get_me(profile: Profile = Depends(require_user)) -> ProfileResponse:
    return ProfileResponse.model_validate(profile, from_attributes=True)
