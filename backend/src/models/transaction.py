from datetime import date, datetime
from sqlalchemy import Date, DateTime, ForeignKey, Numeric, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from src.db.base import Base


class Transaction(Base):
    __tablename__ = "transactions"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True)
    company_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("companies.id"), nullable=False)
    customer_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("customers.id"), nullable=True)
    cash_session_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("cash_sessions.id"), nullable=True)
    transaction_date: Mapped[date] = mapped_column(Date, nullable=False)
    document_type: Mapped[str] = mapped_column(String, nullable=True)
    document_number: Mapped[str] = mapped_column(String, nullable=True)
    description: Mapped[str] = mapped_column(Text, nullable=True)
    transaction_type: Mapped[str] = mapped_column(String, nullable=False)
    total_amount: Mapped[float] = mapped_column(Numeric(14, 2), nullable=False)
    status: Mapped[str] = mapped_column(String, nullable=False)
    payment_difference_amount: Mapped[float] = mapped_column(Numeric(14, 2), nullable=False)
    payment_difference_reason: Mapped[str] = mapped_column(Text, nullable=True)
    created_by: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("profiles.id"), nullable=True)
    updated_by: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("profiles.id"), nullable=True)
    cancelled_by: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("profiles.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    cancelled_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    cancellation_reason: Mapped[str] = mapped_column(Text, nullable=True)
