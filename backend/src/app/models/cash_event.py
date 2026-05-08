"""
Cash Event model representing significant lifecycle events of a cash session.
Used for auditing and tracking session-level changes (open, close, delivery).
"""
from datetime import datetime
from typing import Any
from sqlalchemy import DateTime, ForeignKey, JSON, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.base import Base

class CashEvent(Base):
    """
    SQLAlchemy model for the 'cash_events' table.
    Tracks key events within a cash session, including actors and event payloads.
    """
    __tablename__ = "cash_events"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True)
    cash_session_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("cash_sessions.id"), nullable=True)
    event_type: Mapped[str] = mapped_column(String, nullable=False)
    actor_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("profiles.id"), nullable=False)
    event_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    payload: Mapped[Any] = mapped_column(JSON, nullable=True)
    note: Mapped[str] = mapped_column(Text, nullable=True)
