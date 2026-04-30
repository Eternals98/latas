from datetime import datetime

from pydantic import BaseModel


class CompanyResponse(BaseModel):
    id: str
    name: str
    is_active: bool
    created_at: datetime


class CustomerResponse(BaseModel):
    id: str
    name: str
    phone: str | None
    is_generic: bool
    is_active: bool
    created_at: datetime


class PaymentMethodResponse(BaseModel):
    id: str
    name: str
    code: str
    affects_cash: bool
    is_active: bool
    created_at: datetime


class ProfileResponse(BaseModel):
    id: str
    full_name: str
    role: str
    is_active: bool
    created_at: datetime
