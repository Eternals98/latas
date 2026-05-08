"""
Cash session schemas.
Manages the lifecycle of a cash drawer session (opening, closing, and state).
"""
from __future__ import annotations
from datetime import date, datetime
from decimal import Decimal, ROUND_HALF_UP
from pydantic import BaseModel, Field, field_serializer, field_validator
from .movement import CashMovementItem

MONEY_QUANT = Decimal("0.01")

def to_money(value: Decimal | str | float | int) -> Decimal:
    return Decimal(str(value)).quantize(MONEY_QUANT, rounding=ROUND_HALF_UP)

class CashOpenRequest(BaseModel):
    """Request to open a new cash session."""
    session_date: date
    opening_cash: Decimal

    @field_validator("opening_cash")
    @classmethod
    def validate_opening_cash(cls, value: Decimal) -> Decimal:
        amount = to_money(value)
        if amount < 0:
            raise ValueError("opening_cash must be greater than or equal to 0")
        return amount

class CashCloseRequest(BaseModel):
    """Request to close an existing cash session."""
    session_date: date
    counted_cash: Decimal

    @field_validator("counted_cash")
    @classmethod
    def validate_counted_cash(cls, value: Decimal) -> Decimal:
        amount = to_money(value)
        if amount < 0:
            raise ValueError("counted_cash must be greater than or equal to 0")
        return amount

class CashSessionResponse(BaseModel):
    """Response detailing the state and totals of a cash session."""
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
    """Detail view of a cash session, including all associated movements."""
    session: CashSessionResponse
    movements: list[CashMovementItem]

class CashHistoryResponse(BaseModel):
    """Paginated history of cash sessions."""
    items: list[CashSessionResponse]
    total: int

class CashSessionRecord(BaseModel):
    """Internal record representation of a cash session for mapping."""
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

def cash_session_record_to_response(record: CashSessionRecord) -> CashSessionResponse:
    """Maps a CashSessionRecord to a CashSessionResponse."""
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
