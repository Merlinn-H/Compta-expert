"""
Quebec tax calculations: TPS (5%) and TVQ (9.975%)
CTI = Crédit de taxe sur les intrants (federal input tax credit)
RTI = Remboursement de la taxe sur les intrants (provincial input tax credit)
"""

from datetime import date
from typing import List, Optional

from sqlalchemy.orm import Session

from app.models.tax_entry import TaxEntry
from app.models.transaction import Transaction

TPS_RATE = 5.0
TVQ_RATE = 9.975


def calculate_tps(amount_before_tax: float) -> float:
    return round(amount_before_tax * TPS_RATE / 100, 2)


def calculate_tvq(amount_before_tax: float) -> float:
    return round(amount_before_tax * TVQ_RATE / 100, 2)


def get_quarterly_summary(
    db: Session,
    user_id: int,
    year: int,
    quarter: int,  # 1-4
) -> dict:
    """
    Generate quarterly TPS/TVQ remittance summary for Revenu Québec and CRA.
    Quarter 1: Jan-Mar, Q2: Apr-Jun, Q3: Jul-Sep, Q4: Oct-Dec
    """
    quarter_months = {
        1: (1, 3),
        2: (4, 6),
        3: (7, 9),
        4: (10, 12),
    }
    start_month, end_month = quarter_months[quarter]
    date_from = date(year, start_month, 1)

    # Last day of end month
    import calendar
    last_day = calendar.monthrange(year, end_month)[1]
    date_to = date(year, end_month, last_day)

    transactions = (
        db.query(Transaction)
        .filter(
            Transaction.user_id == user_id,
            Transaction.jurisdiction == "quebec",
            Transaction.date >= date_from,
            Transaction.date <= date_to,
        )
        .all()
    )

    # TPS collected (on income transactions) — owed to CRA
    tps_collected = 0.0
    # TVQ collected (on income transactions) — owed to Revenu Québec
    tvq_collected = 0.0
    # CTI — TPS paid on expenses, recoverable from CRA
    cti_tps = 0.0
    # RTI — TVQ paid on expenses, recoverable from Revenu Québec
    rti_tvq = 0.0

    for t in transactions:
        for tax in t.tax_entries:
            if tax.tax_type == "TPS":
                if t.type == "income":
                    tps_collected += tax.amount
                elif t.type == "expense" and tax.recoverable:
                    cti_tps += tax.amount
            elif tax.tax_type == "TVQ":
                if t.type == "income":
                    tvq_collected += tax.amount
                elif t.type == "expense" and tax.recoverable:
                    rti_tvq += tax.amount

    net_tps = round(tps_collected - cti_tps, 2)
    net_tvq = round(tvq_collected - rti_tvq, 2)

    return {
        "year": year,
        "quarter": quarter,
        "period": f"{date_from} to {date_to}",
        "tps": {
            "collected": round(tps_collected, 2),
            "cti_recoverable": round(cti_tps, 2),
            "net_remittance": net_tps,
            "label": "TPS/GST — CRA",
        },
        "tvq": {
            "collected": round(tvq_collected, 2),
            "rti_recoverable": round(rti_tvq, 2),
            "net_remittance": net_tvq,
            "label": "TVQ — Revenu Québec",
        },
        "total_remittance": round(net_tps + net_tvq, 2),
        "transaction_count": len(transactions),
    }


def get_annual_payroll_summary(
    db: Session,
    user_id: int,
    year: int,
) -> dict:
    """
    Basic RL-1 / T4 data preparation — summarizes income transactions for the year.
    """
    date_from = date(year, 1, 1)
    date_to = date(year, 12, 31)

    income_transactions = (
        db.query(Transaction)
        .filter(
            Transaction.user_id == user_id,
            Transaction.jurisdiction == "quebec",
            Transaction.type == "income",
            Transaction.date >= date_from,
            Transaction.date <= date_to,
        )
        .all()
    )

    total_income_cad = sum(
        t.amount if t.currency == "CAD" else (t.converted_amount or 0)
        for t in income_transactions
    )

    return {
        "year": year,
        "total_income_cad": round(total_income_cad, 2),
        "transaction_count": len(income_transactions),
        "note": "Veuillez utiliser ces données comme base pour préparer vos feuillets RL-1 et T4. Consultez un comptable agréé.",
    }
