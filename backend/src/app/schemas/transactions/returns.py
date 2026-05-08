"""
Return-specific transaction schemas.
Handles customer refunds and returns linked to an original sale.
"""
from .base import TransactionCreateRequest
from pydantic import Field

class ReturnCreateRequest(TransactionCreateRequest):
    """Request for creating a return/refund transaction."""
    parent_transaction_id: str = Field(..., description="The ID of the original sale being returned")
