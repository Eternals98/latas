"""
PaymentMethod model representing the catalog of available payment types.
Defines whether a payment method impacts the physical cash drawer.
"""
from datetime import datetime

from sqlalchemy import Boolean, DateTime, String, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.base import Base

class PaymentMethod(Base):
    """
    SQLAlchemy model for the 'payment_methods' table.
    Catalog of payment methods (e.g., Cash, Card, Transfer) and their cash impact.
    """
    __tablename__ = "payment_methods"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, server_default=text("gen_random_uuid()"))
    name: Mapped[str] = mapped_column(String, nullable=False)
    code: Mapped[str] = mapped_column(String, nullable=False)
    affects_cash: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default=text("false"))
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True, server_default=text("true"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=text("now()"))
