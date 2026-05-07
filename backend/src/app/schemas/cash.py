from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal, ROUND_HALF_UP

from pydantic import BaseModel, Field, field_serializer, field_validator

MONEY_QUANT = Decimal("0.01")


def to_money(value: Decimal | str | float | int) -> Decimal:
    return Decimal(str(value)).quantize(MONEY_QUANT, rounding=ROUND_HALF_UP)


class ErrorResponse(BaseModel):
    detail: str


class CashOpenRequest(BaseModel):
    session_date: date
    opening_cash: Decimal

    @field_validator("opening_cash")
    @classmethod
    def validate_opening_cash(cls, value: Decimal) -> Decimal:
        amount = to_money(value)
        if amount < 0:
            raise ValueError("opening_cash must be greater than or equal to 0")
        return amount


class CashActionRequest(BaseModel):
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
    direction: str = Field(pattern="^(in|out)$")
    reason: str = Field(min_length=1)

    @field_validator("reason")
    @classmethod
    def validate_reason(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("reason is required")
        return cleaned


class CashCloseRequest(BaseModel):
    session_date: date
    counted_cash: Decimal

    @field_validator("counted_cash")
    @classmethod
    def validate_counted_cash(cls, value: Decimal) -> Decimal:
        amount = to_money(value)
        if amount < 0:
            raise ValueError("counted_cash must be greater than or equal to 0")
        return amount


class CashMovementItem(BaseModel):
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


class CashSessionResponse(BaseModel):
    id: str
    session_date: str
    status: str
    opening_cash: Decimal
    closing_cash_expected: Decimal | None
    closing_cash_counted: Decimal | None
    difference_amount: Decimal | None
    cash_balance: Decimal
    vault_balance: Decimal
    total_operational_balance: Decimal
    opened_by: str | None
    opened_by_label: str | None = None
    closed_by: str | None
    closed_by_label: str | None = None
    opened_at: str
    closed_at: str | None

    @field_serializer(
        "opening_cash",
        "closing_cash_expected",
        "closing_cash_counted",
        "difference_amount",
        "cash_balance",
        "vault_balance",
        "total_operational_balance",
        when_used="json",
    )
    def serialize_money(self, value: Decimal | None) -> str | None:
        if value is None:
            return None
        return f"{to_money(value):.2f}"


class CashSessionDetailResponse(BaseModel):
    session: CashSessionResponse
    movements: list[CashMovementItem]


class CashHistoryResponse(BaseModel):
    items: list[CashSessionResponse]
    total: int


class CashEventItem(BaseModel):
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
    items: list[CashEventItem]
    total: int


class CashSessionRecord(BaseModel):
    id: str
    session_date: date
    status: str
    opening_cash: Decimal
    closing_cash_expected: Decimal | None
    closing_cash_counted: Decimal | None
    difference_amount: Decimal | None
    cash_balance: Decimal
    vault_balance: Decimal
    total_operational_balance: Decimal
    opened_by: str | None
    opened_by_label: str | None = None
    closed_by: str | None
    closed_by_label: str | None = None
    opened_at: datetime
    closed_at: datetime | None


class CashMovementRecord(BaseModel):
    id: str
    transaction_id: str | None
    movement_date: date
    movement_type: str
    amount: Decimal
    description: str | None
    created_by: str | None
    created_at: datetime


class CashEventRecord(BaseModel):
    id: str
    cash_session_id: str | None
    event_type: str
    actor_id: str
    actor_label: str | None = None
    event_at: datetime
    payload: dict | None = None
    note: str | None = None


def cash_session_record_to_response(record: CashSessionRecord) -> CashSessionResponse:
    return CashSessionResponse(
        id=record.id,
        session_date=record.session_date.isoformat(),
        status=record.status,
        opening_cash=to_money(record.opening_cash),
        closing_cash_expected=to_money(record.closing_cash_expected) if record.closing_cash_expected is not None else None,
        closing_cash_counted=to_money(record.closing_cash_counted) if record.closing_cash_counted is not None else None,
        difference_amount=to_money(record.difference_amount) if record.difference_amount is not None else None,
        cash_balance=to_money(record.cash_balance),
        vault_balance=to_money(record.vault_balance),
        total_operational_balance=to_money(record.total_operational_balance),
        opened_by=record.opened_by,
        opened_by_label=record.opened_by_label,
        closed_by=record.closed_by,
        closed_by_label=record.closed_by_label,
        opened_at=record.opened_at.isoformat(),
        closed_at=record.closed_at.isoformat() if record.closed_at else None,
    )


def cash_movement_record_to_response(record: CashMovementRecord) -> CashMovementItem:
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


def cash_event_label(value: str) -> str:
    labels = {
        "open": "Apertura",
        "close": "Cierre",
        "delivery": "Entrega a Bóveda",
        "reopen": "Reapertura",
    }
    return labels.get(value, value.replace("_", " ").title())


def cash_event_record_to_response(record: CashEventRecord) -> CashEventItem:
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
