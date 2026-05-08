"""
TransactionPayment model representing the breakdown of payments for a transaction.
Allows a single transaction to be paid with multiple payment methods.
"""
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Numeric
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.base import Base

class TransactionPayment(Base):
    """
    SQLAlchemy model for the 'transaction_payments' table.
    Links a transaction to one or more payment methods and their respective amounts.
    """
    __tablename__ = "transaction_payments"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True)
    transaction_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("transactions.id"), nullable=False)
    payment_method_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("payment_methods.id"), nullable=False)
    amount: Mapped[float] = mapped_column(Numeric(14, 2), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
