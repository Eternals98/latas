"""
Sale-specific transaction schemas.
Extends the base transaction to include customer and document details for sales.
"""
from __future__ import annotations
from datetime import datetime
from .base import (
    TransactionCreateRequest, 
    TransactionResponse, 
    TransactionPaymentResponse, 
    TransactionCustomerResponse, 
    TransactionCompanyResponse,
    to_money
)
from pydantic import Field

class SaleCreateRequest(TransactionCreateRequest):
    """Request for creating a sales transaction."""
    customer_id: str | None = None
    document_number: str | None = None

class SaleResponse(TransactionResponse):
    """Response for a sales transaction, including customer and payment details."""
    company: TransactionCompanyResponse
    customer: TransactionCustomerResponse | None
    document_number: str | None
    payments: list[TransactionPaymentResponse]

def sale_record_to_response(record) -> SaleResponse:
    """Maps a database Transaction record and its relations to a SaleResponse."""
    # Assuming record is a SaleDetailRecord-like object from the service
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
