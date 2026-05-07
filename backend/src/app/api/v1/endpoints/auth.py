from fastapi import APIRouter, Depends, Request
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.schemas.phase1 import ProfileResponse
from app.models.profile import Profile
from app.services.supabase_auth import require_user

limiter = Limiter(key_func=get_remote_address)

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.get("/me", response_model=ProfileResponse)
@limiter.limit("30/minute")
async def get_me(request: Request, profile: Profile = Depends(require_user)) -> ProfileResponse:
    return ProfileResponse.model_validate(profile, from_attributes=True)