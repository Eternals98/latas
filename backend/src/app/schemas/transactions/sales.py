"""
Sale-specific transaction schemas.
Extends the base transaction to include customer and document details for sales.
"""
from __future__ import annotations
from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel, Field
from .base import (
    TransactionCreateRequest,
    TransactionPaymentResponse,
    TransactionCustomerResponse,
    TransactionCompanyResponse,
    TransactionListFilters,
    to_money,
)


class SaleCreateRequest(TransactionCreateRequest):
    """Request for creating a sales transaction."""
    customer_id: str | None = None
    document_number: str | None = None


class SaleUpdateRequest(SaleCreateRequest):
    """Request for updating a sale (admin only). Same fields as create."""
    pass


class SalePaymentResponse(TransactionPaymentResponse):
    """Payment detail within a sale response."""
    pass


class SaleDetailRecord(BaseModel):
    """Internal record used by the service layer to carry joined sale data."""
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
    payment_terms: str
    status: str
    transaction_type: str
    created_at: datetime
    payments: list[SalePaymentResponse]


class SaleListFilters(TransactionListFilters):
    """Filters for listing sales. Inherits all base transaction filters."""
    pass


class SaleResponse(BaseModel):
    """Response for a sales transaction, including customer and payment details."""
    id: str
    company: TransactionCompanyResponse
    customer: TransactionCustomerResponse | None
    transaction_date: str
    document_number: str | None
    description: str
    total_amount: Decimal
    payment_terms: str
    status: str
    transaction_type: str
    created_at: str
    payments: list[SalePaymentResponse]


def sale_record_to_response(record: SaleDetailRecord) -> SaleResponse:
    """Maps a SaleDetailRecord to a SaleResponse."""
    return SaleResponse(
        id=record.id,
        company=TransactionCompanyResponse(id=record.company_id, name=record.company_name),
        customer=(
            TransactionCustomerResponse(
                id=record.customer_id,
                name=record.customer_name or "Cliente sin nombre",
                phone=record.customer_phone,
            )
            if record.customer_id and record.customer_name
            else None
        ),
        transaction_date=record.transaction_date.isoformat() if isinstance(record.transaction_date, datetime) else record.transaction_date,
        document_number=record.document_number,
        description=record.description,
        total_amount=to_money(record.total_amount),
        payment_terms=record.payment_terms,
        status=record.status,
        transaction_type=record.transaction_type,
        created_at=record.created_at.isoformat() if isinstance(record.created_at, datetime) else record.created_at,
        payments=record.payments,
    )
