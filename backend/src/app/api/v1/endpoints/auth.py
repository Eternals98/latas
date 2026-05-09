"""
Authentication endpoints.
Handles user identity verification and session profile retrieval.
"""
from fastapi import APIRouter, Depends, Request
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.schemas.phase1 import ProfileResponse
from app.models.profile import Profile
from app.services.supabase_auth import require_user

# Rate limiter to prevent brute force on auth endpoints
limiter = Limiter(key_func=get_remote_address)

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/callback")
@limiter.limit("30/minute")
async def auth_callback(
    request: Request,
    profile: Profile = Depends(require_user),
) -> dict:
    """
    Callback endpoint for Supabase authentication.
    Validates JWT and returns user profile.
    """
    return {
        "id": profile.id,
        "email": profile.email,
        "full_name": profile.full_name,
        "role": profile.role,
    }


@router.get("/me", response_model=ProfileResponse)
@limiter.limit("30/minute")
async def get_me(
    request: Request,
    profile: Profile = Depends(require_user),
) -> ProfileResponse:
    """
    Retrieves the profile of the currently authenticated user.
    Validates the JWT session via the require_user dependency.
    """
    return ProfileResponse.model_validate(profile, from_attributes=True)