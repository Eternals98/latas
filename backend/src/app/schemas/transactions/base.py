"""
Base schemas for all financial transactions in the system.
Defines common fields, money utilities, and shared validators used by all transaction types.
"""
from __future__ import annotations
from datetime import date, datetime
from decimal import Decimal, ROUND_HALF_UP
from typing import Literal
from pydantic import BaseModel, Field, field_serializer, field_validator

# Global constant for money quantization
MONEY_QUANT = Decimal("0.01")

def to_money(value: Decimal | str | float | int) -> Decimal:
    """Quantizes a value to two decimal places for financial consistency."""
    return Decimal(str(value)).quantize(MONEY_QUANT, rounding=ROUND_HALF_UP)

class TransactionPaymentCreateRequest(BaseModel):
    """Request schema for a single payment method associated with a transaction."""
    payment_method_id: str = Field(min_length=1)
    amount: Decimal

    @field_validator("payment_method_id")
    @classmethod
    def validate_payment_method_id(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("payment_method_id is required")
        return cleaned

    @field_validator("amount")
    @classmethod
    def validate_amount(cls, value: Decimal) -> Decimal:
        amount = to_money(value)
        if amount <= 0:
            raise ValueError("amount must be greater than 0")
        return amount

class TransactionBase(BaseModel):
    """Base fields shared across all types of financial transactions."""
    company_id: str = Field(min_length=1)
    transaction_date: datetime
    description: str = Field(min_length=1)
    total_amount: Decimal
    payment_terms: Literal["Contado", "Credito"]
    status: Literal["confirmed", "pending"]

    @field_validator("company_id")
    @classmethod
    def validate_company_id(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("company_id is required")
        return cleaned

    @field_validator("description")
    @classmethod
    def validate_description(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("description is required")
        return cleaned

    @field_validator("total_amount")
    @classmethod
    def validate_total_amount(cls, value: Decimal) -> Decimal:
        total = to_money(value)
        if total <= 0:
            raise ValueError("total_amount must be greater than 0")
        return total

class TransactionCreateRequest(TransactionBase):
    """Base request for creating a transaction, including its payment breakdown."""
    payments: list[TransactionPaymentCreateRequest] = Field(min_length=1)

class TransactionCancelRequest(BaseModel):
    """Request to cancel a transaction."""
    reason: str = Field(min_length=1)
    impact_cash: bool = False

    @field_validator("reason")
    @classmethod
    def validate_reason(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("reason is required")
        return cleaned

class TransactionResponse(BaseModel):
    """Generic response schema for any transaction in the system."""
    id: str
    company_id: str
    transaction_date: str
    description: str
    total_amount: Decimal
    payment_terms: str
    status: str
    transaction_type: str
    created_at: str

    @field_serializer("total_amount", when_used="json")
    def serialize_total_amount(self, value: Decimal) -> str:
        return f"{to_money(value):.2f}"

class TransactionPaymentResponse(BaseModel):
    """Response schema for a transaction payment."""
    id: str
    payment_method_id: str
    payment_method_name: str
    amount: Decimal

    @field_serializer("amount", when_used="json")
    def serialize_amount(self, value: Decimal) -> str:
        return f"{to_money(value):.2f}"

class TransactionCompanyResponse(BaseModel):
    """Basic company info returned within a transaction."""
    id: str
    name: str

class TransactionCustomerResponse(BaseModel):
    """Basic customer info returned within a transaction."""
    id: str
    name: str
    phone: str | None

class TransactionListResponse(BaseModel):
    """Paginated list of transactions."""
    items: list[TransactionResponse]
    total: int
    limit: int
    offset: int

class TransactionListFilters(BaseModel):
    """Filters for listing transactions."""
    date_from: date | None = None
    date_to: date | None = None
    company_id: str | None = None
    company_ids: list[str] = Field(default_factory=list)
    payment_method_ids: list[str] = Field(default_factory=list)
    search: str | None = None
    limit: int = 50
    offset: int = 0

    @field_validator("limit")
    @classmethod
    def validate_limit(cls, value: int) -> int:
        if value < 1 or value > 200:
            raise ValueError("limit must be between 1 and 200")
        return value

    @field_validator("offset")
    @classmethod
    def validate_offset(cls, value: int) -> int:
        if value < 0:
            raise ValueError("offset must be greater than or equal to 0")
        return value

class ErrorResponse(BaseModel):
    """Generic error response schema."""
    detail: str
