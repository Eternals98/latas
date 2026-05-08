"""
Cash movement schemas.
Represents the physical movement of money in and out of a cash session.
"""
from __future__ import annotations
from datetime import date, datetime
from decimal import Decimal, ROUND_HALF_UP
from pydantic import BaseModel, Field, field_serializer, field_validator

MONEY_QUANT = Decimal("0.01")

def to_money(value: Decimal | str | float | int) -> Decimal:
    return Decimal(str(value)).quantize(MONEY_QUANT, rounding=ROUND_HALF_UP)

class CashActionRequest(BaseModel):
    """Basic request for a cash action (e.g., delivery)."""
    movement_date: date
    amount: Decimal
    description: str | None = None

    @field_validator("amount")
    @classmethod
    def validate_amount(cls, value: Decimal) -> Decimal:
        amount = to_money(value)
        if amount <= 0:
            raise ValueError("amount must be greater than 0")
        return amount

    @field_validator("description")
    @classmethod
    def validate_description(cls, value: str | None) -> str | None:
        if value is None:
            return None
        cleaned = value.strip()
        return cleaned or None

class CashAdjustmentRequest(CashActionRequest):
    """Request for a manual cash adjustment."""
    direction: str = Field(pattern="^(in|out)$")
    reason: str = Field(min_length=1)

    @field_validator("reason")
    @classmethod
    def validate_reason(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("reason is required")
        return cleaned

class CashMovementItem(BaseModel):
    """Item representing a single cash movement event."""
    id: str
    transaction_id: str | None
    movement_date: str
    movement_type: str
    amount: Decimal
    description: str | None
    created_by: str | None
    created_at: str

    @field_serializer("amount", when_used="json")
    def serialize_amount(self, value: Decimal) -> str:
        return f"{to_money(value):.2f}"

class CashMovementRecord(BaseModel):
    """Internal record representation of a cash movement for mapping."""
    id: str
    transaction_id: str | None
    movement_date: date
    movement_type: str
    amount: Decimal
    description: str | None
    created_by: str | None
    created_at: datetime

def cash_movement_record_to_response(record: CashMovementRecord) -> CashMovementItem:
    """Maps a CashMovementRecord to a CashMovementItem."""
    return CashMovementItem(
        id=record.id,
        transaction_id=record.transaction_id,
        movement_date=record.movement_date.isoformat(),
        movement_type=record.movement_type,
        amount=to_money(record.amount),
        description=record.description,
        created_by=record.created_by,
        created_at=record.created_at.isoformat(),
    )

class CashEventItem(BaseModel):
    """Response item for a cash event."""
    id: str
    cash_session_id: str | None
    event_type: str
    event_label: str
    actor_id: str
    actor_label: str | None = None
    event_at: str
    payload: dict | None = None
    note: str | None = None

class CashEventHistoryResponse(BaseModel):
    """Paginated history of cash events."""
    items: list[CashEventItem]
    total: int

class CashEventRecord(BaseModel):
    """Internal record representation of a cash event."""
    id: str
    cash_session_id: str | None
    event_type: str
    actor_id: str
    actor_label: str | None = None
    event_at: datetime
    payload: dict | None = None
    note: str | None = None

def cash_event_label(value: str) -> str:
    """Returns a localized label for a cash event type."""
    labels = {
        "open": "Apertura",
        "close": "Cierre",
        "delivery": "Entrega a Bóveda",
        "reopen": "Reapertura",
    }
    return labels.get(value, value.replace("_", " ").title())

def cash_event_record_to_response(record: CashEventRecord) -> CashEventItem:
    """Maps a CashEventRecord to a CashEventItem."""
    return CashEventItem(
        id=record.id,
        cash_session_id=record.cash_session_id,
        event_type=record.event_type,
        event_label=cash_event_label(record.event_type),
        actor_id=record.actor_id,
        actor_label=record.actor_label,
        event_at=record.event_at.isoformat(),
        payload=record.payload,
        note=record.note,
    )
