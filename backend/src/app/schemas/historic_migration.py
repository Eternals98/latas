from __future__ import annotations

from datetime import date
from pydantic import BaseModel


class HistoricMigrationResponse(BaseModel):
    imported_sheets: int
    imported_rows: int
    sale_transactions: int
    cancelled_transactions: int
    grouped_document_count: int
    cash_movements: int
    cash_in_movements: int
    cash_out_movements: int
    vault_in_movements: int
    payment_rows: int
    warnings: list[str]
    period_start: date | None = None
    period_end: date | None = None
