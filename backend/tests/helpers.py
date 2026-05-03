from sqlalchemy.orm import Session
from sqlalchemy import text


def ensure_auth_user(db_session: Session, user_id: str, email: str, full_name: str) -> None:
    db_session.execute(
        text(
            """
            insert into auth.users (
                id, aud, role, email, encrypted_password, email_confirmed_at,
                raw_app_meta_data, raw_user_meta_data, is_sso_user, is_anonymous,
                created_at, updated_at
            )
            values (
                cast(:id as uuid), 'authenticated', 'authenticated', cast(:email as text), '',
                now(),
                '{}'::jsonb,
                jsonb_build_object('full_name', cast(:full_name as text), 'name', cast(:full_name as text)),
                false,
                false,
                now(),
                now()
            )
            on conflict (id) do update set
                email = excluded.email,
                raw_user_meta_data = excluded.raw_user_meta_data,
                updated_at = excluded.updated_at
            """
        ),
        {"id": user_id, "email": email, "full_name": full_name},
    )


def set_request_user(db_session: Session, user_id: str) -> None:
    db_session.execute(text("select set_config('request.jwt.claim.sub', :user_id, true)"), {"user_id": user_id})
    db_session.execute(text("select set_config('request.jwt.claim.role', 'authenticated', true)"))
