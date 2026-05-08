"""
Admin User model for internal system administration.
Distinguishes administrative users from standard operational profiles.
"""
from sqlalchemy import Boolean, String, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.base import Base

class AdminUser(Base):
    """
    SQLAlchemy model for the 'admin_users' table.
    Stores administrative privileges and metadata for system managers.
    """
    __tablename__ = "admin_users"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True)
    profile_id: Mapped[str] = mapped_column(UUID(as_uuid=False), nullable=False)
    is_superadmin: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default=text("false"))
