from sqlalchemy.orm import Session
from sqlalchemy import text


def set_request_user(db_session: Session, user_id: str) -> None:
    db_session.execute(text("select set_config('request.jwt.claim.sub', :user_id, true)"), {"user_id": user_id})
    db_session.execute(text("select set_config('request.jwt.claim.role', 'authenticated', true)"))
