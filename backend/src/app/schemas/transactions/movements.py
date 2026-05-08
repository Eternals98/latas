"""
Movement-specific transaction schemas.
A Movimiento moves cash from the drawer to the vault (cash_out + vault_in).
"""
from __future__ import annotations
from datetime import date, datetime
from decimal import Decimal, ROUND_HALF_UP
from pydantic import BaseModel, Field, field_serializer, field_validator

MONEY_QUANT = Decimal("0.01")


def to_money(value: Decimal | str | float | int) -> Decimal:
    return Decimal(str(value)).quantize(MONEY_QUANT, rounding=ROUND_HALF_UP)


class MovementCreateRequest(BaseModel):
    """Request for creating a cash movement (drawer → vault)."""
    company_id: str = Field(min_length=1)
    movement_date: date
    amount: Decimal
    description: str = Field(min_length=1)

    @field_validator("amount")
    @classmethod
    def validate_amount(cls, value: Decimal) -> Decimal:
        amount = to_money(value)
        if amount <= 0:
            raise ValueError("amount must be greater than 0")
        return amount

    @field_validator("company_id", "description")
    @classmethod
    def validate_nonempty(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("Field is required")
        return cleaned


class MovementResponse(BaseModel):
    """Response for a cash movement transaction."""
    id: str
    company_id: str
    movement_date: str
    amount: Decimal
    description: str
    status: str
    transaction_type: str
    created_at: str

    @field_serializer("amount", when_used="json")
    def serialize_amount(self, value: Decimal) -> str:
        return f"{to_money(value):.2f}"


def movement_transaction_to_response(transaction) -> MovementResponse:
    """Maps a Transaction ORM object to a MovementResponse."""
    return MovementResponse(
        id=transaction.id,
        company_id=transaction.company_id,
        movement_date=transaction.transaction_date.date().isoformat()
        if isinstance(transaction.transaction_date, datetime)
        else str(transaction.transaction_date),
        amount=to_money(transaction.total_amount),
        description=transaction.description,
        status=transaction.status,
        transaction_type=transaction.transaction_type,
        created_at=transaction.created_at.isoformat()
        if isinstance(transaction.created_at, datetime)
        else str(transaction.created_at),
    )
