"""
Movement-specific transaction schemas.
Handles physical cash movements, such as transfers from cash drawer to vault.
"""
from .base import TransactionCreateRequest

class MovementCreateRequest(TransactionCreateRequest):
    """Request for creating a cash movement transaction (e.g., Cash to Vault)."""
    # Specifically for movements, we might want to ensure certain payment methods are used
    # or add a destination field if we had multiple vaults.
    pass
