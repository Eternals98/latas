from datetime import date, datetime
from sqlalchemy import Date, DateTime, ForeignKey, Numeric, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from src.db.base import Base


class CashSession(Base):
    __tablename__ = "cash_sessions"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True)
    session_date: Mapped[date] = mapped_column(Date, nullable=False)
    opening_cash: Mapped[float] = mapped_column(Numeric(14, 2), nullable=False)
    closing_cash_expected: Mapped[float] = mapped_column(Numeric(14, 2), nullable=True)
    closing_cash_counted: Mapped[float] = mapped_column(Numeric(14, 2), nullable=True)
    difference_amount: Mapped[float] = mapped_column(Numeric(14, 2), nullable=True)
    status: Mapped[str] = mapped_column(String, nullable=False)
    opened_by: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("profiles.id"), nullable=True)
    closed_by: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("profiles.id"), nullable=True)
    opened_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    closed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
