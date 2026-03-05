from typing import Dict, List, Optional

from pydantic import BaseModel


class JurisdictionSummary(BaseModel):
    total_income_original: float
    total_expenses_original: float
    net_balance_original: float
    currency: str
    total_income_cad: float
    total_expenses_cad: float
    net_balance_cad: float
    total_income_eur: float
    total_expenses_eur: float
    net_balance_eur: float


class MonthlyDataPoint(BaseModel):
    month: str  # "2024-03"
    income: float
    expenses: float
    net: float
    currency: str


class DashboardSummary(BaseModel):
    quebec: JurisdictionSummary
    france: JurisdictionSummary
    combined: Dict[str, float]
    monthly_trend: List[MonthlyDataPoint]
    recent_transactions: list
