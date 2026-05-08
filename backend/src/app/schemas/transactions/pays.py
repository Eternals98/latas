"""
Pay-specific transaction schemas.
A Pago registers an expense payment. It generates a cash_out only when the
payment method affects cash (e.g., efectivo).
"""
from __future__ import annotations
from datetime import datetime
from decimal import Decimal, ROUND_HALF_UP
from typing import Literal
from pydantic import BaseModel, Field, field_serializer, field_validator

MONEY_QUANT = Decimal("0.01")


def to_money(value: Decimal | str | float | int) -> Decimal:
    return Decimal(str(value)).quantize(MONEY_QUANT, rounding=ROUND_HALF_UP)


class PayCreateRequest(BaseModel):
    """Request for creating an expense payment transaction."""
    company_id: str = Field(min_length=1)
    transaction_date: datetime
    description: str = Field(min_length=1)
    total_amount: Decimal
    payment_method_id: str = Field(min_length=1)
    payment_terms: Literal["Contado", "Credito"] = "Contado"

    @field_validator("total_amount")
    @classmethod
    def validate_total_amount(cls, value: Decimal) -> Decimal:
        amount = to_money(value)
        if amount <= 0:
            raise ValueError("total_amount must be greater than 0")
        return amount

    @field_validator("company_id", "description", "payment_method_id")
    @classmethod
    def validate_nonempty(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("Field is required")
        return cleaned


class PayResponse(BaseModel):
    """Response for a payment/expense transaction."""
    id: str
    company_id: str
    transaction_date: str
    description: str
    total_amount: Decimal
    payment_method_id: str
    payment_method_name: str
    payment_terms: str
    status: str
    transaction_type: str
    cash_impact: bool
    created_at: str

    @field_serializer("total_amount", when_used="json")
    def serialize_total_amount(self, value: Decimal) -> str:
        return f"{to_money(value):.2f}"
