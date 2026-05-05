from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal, ROUND_HALF_UP

from pydantic import BaseModel, Field, field_serializer, field_validator

MONEY_QUANT = Decimal("0.01")


def to_money(value: Decimal | str | float | int) -> Decimal:
    return Decimal(str(value)).quantize(MONEY_QUANT, rounding=ROUND_HALF_UP)


class SalePaymentCreateRequest(BaseModel):
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


class SaleCreateRequest(BaseModel):
    company_id: str = Field(min_length=1)
    transaction_date: datetime
    document_number: str | None = None
    description: str = Field(min_length=1)
    total_amount: Decimal
    customer_id: str | None = None
    payments: list[SalePaymentCreateRequest] = Field(min_length=1)

    @field_validator("company_id")
    @classmethod
    def validate_company_id(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("company_id is required")
        return cleaned

    @field_validator("document_number")
    @classmethod
    def validate_document_number(cls, value: str | None) -> str | None:
        if value is None:
            return None
        cleaned = value.strip()
        return cleaned or None

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

    @field_validator("customer_id")
    @classmethod
    def validate_customer_id(cls, value: str | None) -> str | None:
        if value is None:
            return None
        cleaned = value.strip()
        return cleaned or None


class SaleUpdateRequest(BaseModel):
    description: str = Field(min_length=1)
    transaction_date: datetime
    company_id: str = Field(min_length=1)
    payments: list[SalePaymentCreateRequest] = Field(min_length=1)

    @field_validator("description")
    @classmethod
    def validate_description(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("description is required")
        return cleaned

    @field_validator("company_id")
    @classmethod
    def validate_company_id(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("company_id is required")
        return cleaned

    @field_validator("payments")
    @classmethod
    def validate_payments(cls, value: list[SalePaymentCreateRequest]) -> list[SalePaymentCreateRequest]:
        if not value:
            raise ValueError("payments is required")
        method_ids = [item.payment_method_id for item in value]
        if len(set(method_ids)) != len(method_ids):
            raise ValueError("No se permiten métodos de pago repetidos en la misma venta.")
        return value


class SaleCancelRequest(BaseModel):
    reason: str = Field(min_length=1)
    impact_cash: bool = False

    @field_validator("reason")
    @classmethod
    def validate_reason(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("reason is required")
        return cleaned


class SalePaymentResponse(BaseModel):
    id: str
    payment_method_id: str
    payment_method_name: str
    amount: Decimal

    @field_serializer("amount", when_used="json")
    def serialize_amount(self, value: Decimal) -> str:
        return f"{to_money(value):.2f}"


class SaleCustomerResponse(BaseModel):
    id: str
    name: str
    phone: str | None


class SaleCompanyResponse(BaseModel):
    id: str
    name: str


class SaleResponse(BaseModel):
    id: str
    company: SaleCompanyResponse
    customer: SaleCustomerResponse | None
    transaction_date: str
    document_number: str | None
    description: str
    total_amount: Decimal
    status: str
    created_at: str
    payments: list[SalePaymentResponse]

    @field_serializer("total_amount", when_used="json")
    def serialize_total_amount(self, value: Decimal) -> str:
        return f"{to_money(value):.2f}"


class SalesListResponse(BaseModel):
    items: list[SaleResponse]
    total: int
    limit: int
    offset: int


class SaleListFilters(BaseModel):
    date_from: date | None = None
    date_to: date | None = None
    company_id: str | None = None
    company_ids: list[str] = Field(default_factory=list)
    payment_method_ids: list[str] = Field(default_factory=list)
    search: str | None = None
    limit: int = 50
    offset: int = 0

    @field_validator("company_id")
    @classmethod
    def validate_company_id(cls, value: str | None) -> str | None:
        if value is None:
            return None
        cleaned = value.strip()
        return cleaned or None

    @field_validator("company_ids", "payment_method_ids")
    @classmethod
    def validate_id_lists(cls, value: list[str]) -> list[str]:
        cleaned = [item.strip() for item in value if item and item.strip()]
        return list(dict.fromkeys(cleaned))

    @field_validator("search")
    @classmethod
    def validate_search(cls, value: str | None) -> str | None:
        if value is None:
            return None
        cleaned = value.strip()
        return cleaned or None

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

    @field_validator("date_to")
    @classmethod
    def validate_date_range(cls, value: date | None, info):
        date_from = info.data.get("date_from")
        if date_from and value and value < date_from:
            raise ValueError("date_to must be greater than or equal to date_from")
        return value


class ErrorResponse(BaseModel):
    detail: str


class SaleDetailRecord(BaseModel):
    id: str
    company_id: str
    company_name: str
    customer_id: str | None
    customer_name: str | None
    customer_phone: str | None
    transaction_date: datetime
    document_number: str | None
    description: str
    total_amount: Decimal
    status: str
    created_at: datetime
    payments: list[SalePaymentResponse]


def sale_record_to_response(record: SaleDetailRecord) -> SaleResponse:
    return SaleResponse(
        id=record.id,
        company=SaleCompanyResponse(id=record.company_id, name=record.company_name),
        customer=(
            SaleCustomerResponse(
                id=record.customer_id,
                name=record.customer_name or "Cliente sin nombre",
                phone=record.customer_phone,
            )
            if record.customer_id and record.customer_name
            else None
        ),
        transaction_date=record.transaction_date.isoformat(),
        document_number=record.document_number,
        description=record.description,
        total_amount=to_money(record.total_amount),
        status=record.status,
        created_at=record.created_at.isoformat(),
        payments=record.payments,
    )
