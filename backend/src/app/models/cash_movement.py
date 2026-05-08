"""
Cash Movement model tracking physical money flow in a session.
Connects cash changes to their triggering transactions (sales, returns, etc).
"""
from datetime import date, datetime
from sqlalchemy import Date, DateTime, ForeignKey, Numeric, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.base import Base

class CashMovement(Base):
    """
    SQLAlchemy model for the 'cash_movements' table.
    Records every single movement of money (In/Out) within a specific cash session.
    """
    __tablename__ = "cash_movements"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True)
    transaction_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("transactions.id"), nullable=True)
    cash_session_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("cash_sessions.id"), nullable=False)
    movement_date: Mapped[date] = mapped_column(Date, nullable=False)
    movement_type: Mapped[str] = mapped_column(String, nullable=False) # cash_in, cash_out, vault_in, vault_out, adjustment_in, adjustment_out
    amount: Mapped[float] = mapped_column(Numeric(14, 2), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=True)
    admin_reason: Mapped[str] = mapped_column(Text, nullable=True)
    created_by: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("profiles.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
