from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from src.db.base import Base


class CashEvent(Base):
    __tablename__ = "cash_events"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True)
    cash_session_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("cash_sessions.id"), nullable=False)
    event_type: Mapped[str] = mapped_column(String, nullable=False)
    actor_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("profiles.id"), nullable=False)
    event_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    payload: Mapped[dict] = mapped_column(JSONB, nullable=True)
    note: Mapped[str] = mapped_column(Text, nullable=True)
