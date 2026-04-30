from datetime import date, datetime
from sqlalchemy import Date, DateTime, ForeignKey, Numeric, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from src.db.base import Base


class CashMovement(Base):
    __tablename__ = "cash_movements"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True)
    transaction_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("transactions.id"), nullable=True)
    cash_session_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("cash_sessions.id"), nullable=False)
    movement_date: Mapped[date] = mapped_column(Date, nullable=False)
    movement_type: Mapped[str] = mapped_column(String, nullable=False)
    amount: Mapped[float] = mapped_column(Numeric(14, 2), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=True)
    created_by: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("profiles.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
