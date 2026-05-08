"""
Payment-specific transaction schemas.
Handles expense payments (e.g., paying a supplier or utility bill from the cash drawer).
"""
from .base import TransactionCreateRequest

class PayCreateRequest(TransactionCreateRequest):
    """Request for creating a payment/expense transaction."""
    pass
