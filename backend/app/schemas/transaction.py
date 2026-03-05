from datetime import date, datetime
from typing import List, Optional

from pydantic import BaseModel

from app.schemas.category import CategoryRead


class TaxEntryCreate(BaseModel):
    tax_type: str  # TPS | TVQ | TVA
    rate: float
    amount: float
    recoverable: bool = False


class TaxEntryRead(BaseModel):
    id: int
    tax_type: str
    rate: float
    amount: float
    recoverable: bool

    class Config:
        from_attributes = True


class TransactionCreate(BaseModel):
    date: date
    description: str
    notes: Optional[str] = None
    amount: float
    currency: str  # CAD | EUR | USD | GBP
    target_currency: Optional[str] = None  # if None, no conversion stored
    jurisdiction: str  # quebec | france
    type: str  # income | expense
    category_id: Optional[int] = None
    tax_entries: Optional[List[TaxEntryCreate]] = []


class TransactionUpdate(BaseModel):
    date: Optional[date] = None
    description: Optional[str] = None
    notes: Optional[str] = None
    amount: Optional[float] = None
    currency: Optional[str] = None
    jurisdiction: Optional[str] = None
    type: Optional[str] = None
    category_id: Optional[int] = None
    # Note: exchange_rate_at_date is NOT updatable — historical rate is immutable


class TransactionRead(BaseModel):
    id: int
    user_id: int
    date: date
    description: str
    notes: Optional[str]
    amount: float
    currency: str
    target_currency: Optional[str]
    exchange_rate_at_date: Optional[float]
    converted_amount: Optional[float]
    jurisdiction: str
    type: str
    category_id: Optional[int]
    category: Optional[CategoryRead]
    tax_entries: List[TaxEntryRead]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class TransactionFilter(BaseModel):
    jurisdiction: Optional[str] = None
    type: Optional[str] = None
    currency: Optional[str] = None
    category_id: Optional[int] = None
    date_from: Optional[date] = None
    date_to: Optional[date] = None
