from collections import defaultdict
from datetime import date
from typing import Dict, List, Optional

from sqlalchemy.orm import Session

from app.models.transaction import Transaction


def get_dashboard_summary(
    db: Session,
    user_id: int,
    year: Optional[int] = None,
    month: Optional[int] = None,
) -> dict:
    query = db.query(Transaction).filter(Transaction.user_id == user_id)

    if year:
        query = query.filter(Transaction.date >= date(year, 1, 1))
        query = query.filter(Transaction.date <= date(year, 12, 31))

    transactions = query.all()

    def empty_summary():
        return {
            "total_income_original": 0.0,
            "total_expenses_original": 0.0,
            "net_balance_original": 0.0,
            "currency": "CAD",
            "total_income_cad": 0.0,
            "total_expenses_cad": 0.0,
            "net_balance_cad": 0.0,
            "total_income_eur": 0.0,
            "total_expenses_eur": 0.0,
            "net_balance_eur": 0.0,
        }

    quebec = empty_summary()
    quebec["currency"] = "CAD"
    france = empty_summary()
    france["currency"] = "EUR"

    monthly: Dict[str, Dict] = defaultdict(
        lambda: {"income": 0.0, "expenses": 0.0, "net": 0.0, "currency": "CAD"}
    )

    for t in transactions:
        month_key = t.date.strftime("%Y-%m")

        # Determine CAD and EUR amounts
        if t.currency == "CAD":
            cad_amount = t.amount
            eur_amount = t.converted_amount if t.target_currency == "EUR" else None
        elif t.currency == "EUR":
            eur_amount = t.amount
            cad_amount = t.converted_amount if t.target_currency == "CAD" else None
        else:
            cad_amount = t.converted_amount if t.target_currency == "CAD" else None
            eur_amount = t.converted_amount if t.target_currency == "EUR" else None

        cad_amount = cad_amount or 0.0
        eur_amount = eur_amount or 0.0

        if t.jurisdiction == "quebec":
            if t.type == "income":
                quebec["total_income_original"] += t.amount
                quebec["total_income_cad"] += cad_amount
                quebec["total_income_eur"] += eur_amount
                monthly[month_key]["income"] += cad_amount
            else:
                quebec["total_expenses_original"] += t.amount
                quebec["total_expenses_cad"] += cad_amount
                quebec["total_expenses_eur"] += eur_amount
                monthly[month_key]["expenses"] += cad_amount
        elif t.jurisdiction == "france":
            if t.type == "income":
                france["total_income_original"] += t.amount
                france["total_income_cad"] += cad_amount
                france["total_income_eur"] += eur_amount
                monthly[month_key]["income"] += eur_amount
            else:
                france["total_expenses_original"] += t.amount
                france["total_expenses_cad"] += cad_amount
                france["total_expenses_eur"] += eur_amount
                monthly[month_key]["expenses"] += eur_amount

    # Compute net balances
    quebec["net_balance_original"] = (
        quebec["total_income_original"] - quebec["total_expenses_original"]
    )
    quebec["net_balance_cad"] = quebec["total_income_cad"] - quebec["total_expenses_cad"]
    quebec["net_balance_eur"] = quebec["total_income_eur"] - quebec["total_expenses_eur"]

    france["net_balance_original"] = (
        france["total_income_original"] - france["total_expenses_original"]
    )
    france["net_balance_cad"] = france["total_income_cad"] - france["total_expenses_cad"]
    france["net_balance_eur"] = france["total_income_eur"] - france["total_expenses_eur"]

    # Monthly trend sorted
    monthly_trend = []
    for month_key in sorted(monthly.keys()):
        data = monthly[month_key]
        data["net"] = data["income"] - data["expenses"]
        data["month"] = month_key
        monthly_trend.append(data)

    # Combined
    combined = {
        "total_income_cad": quebec["total_income_cad"] + france["total_income_cad"],
        "total_expenses_cad": quebec["total_expenses_cad"] + france["total_expenses_cad"],
        "net_cad": (quebec["total_income_cad"] + france["total_income_cad"])
        - (quebec["total_expenses_cad"] + france["total_expenses_cad"]),
        "total_income_eur": quebec["total_income_eur"] + france["total_income_eur"],
        "total_expenses_eur": quebec["total_expenses_eur"] + france["total_expenses_eur"],
        "net_eur": (quebec["total_income_eur"] + france["total_income_eur"])
        - (quebec["total_expenses_eur"] + france["total_expenses_eur"]),
    }

    # Recent transactions (last 10)
    recent = (
        db.query(Transaction)
        .filter(Transaction.user_id == user_id)
        .order_by(Transaction.date.desc())
        .limit(10)
        .all()
    )

    return {
        "quebec": quebec,
        "france": france,
        "combined": combined,
        "monthly_trend": monthly_trend,
        "recent_transactions": recent,
    }
