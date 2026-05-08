"""
Return-specific transaction schemas.
A Devolución always generates a cash_out and must reference a parent transaction.
Partial returns are allowed (amount may be less than parent total).
"""
from __future__ import annotations
from datetime import datetime
from decimal import Decimal, ROUND_HALF_UP
from pydantic import BaseModel, Field, field_serializer, field_validator

MONEY_QUANT = Decimal("0.01")


def to_money(value: Decimal | str | float | int) -> Decimal:
    return Decimal(str(value)).quantize(MONEY_QUANT, rounding=ROUND_HALF_UP)


class ReturnCreateRequest(BaseModel):
    """Request for creating a return/refund transaction."""
    company_id: str = Field(min_length=1)
    transaction_date: datetime
    description: str = Field(min_length=1)
    amount: Decimal
    parent_transaction_id: str = Field(..., min_length=1, description="ID of the original sale or pay being returned")
    payment_method_id: str = Field(min_length=1)

    @field_validator("amount")
    @classmethod
    def validate_amount(cls, value: Decimal) -> Decimal:
        amount = to_money(value)
        if amount <= 0:
            raise ValueError("amount must be greater than 0")
        return amount

    @field_validator("company_id", "description", "parent_transaction_id", "payment_method_id")
    @classmethod
    def validate_nonempty(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("Field is required")
        return cleaned


class ReturnResponse(BaseModel):
    """Response for a return/refund transaction."""
    id: str
    company_id: str
    parent_transaction_id: str
    transaction_date: str
    description: str
    amount: Decimal
    payment_method_id: str
    payment_method_name: str
    status: str
    transaction_type: str
    created_at: str

    @field_serializer("amount", when_used="json")
    def serialize_amount(self, value: Decimal) -> str:
        return f"{to_money(value):.2f}"
