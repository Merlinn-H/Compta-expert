"""
France tax calculations: TVA tracking and CA3 declaration summary.
TVA rates: 20% (normal), 10% (intermediate), 5.5% (reduced), 2.1% (super-reduced), 0%
FEC export: Fichier des Écritures Comptables (format DGFiP)
"""

import csv
import io
from datetime import date
from typing import List

from sqlalchemy.orm import Session

from app.models.tax_entry import TaxEntry
from app.models.transaction import Transaction

TVA_RATES = {
    "normal": 20.0,
    "intermédiaire": 10.0,
    "réduit": 5.5,
    "super-réduit": 2.1,
    "exonéré": 0.0,
}


def get_ca3_summary(
    db: Session,
    user_id: int,
    year: int,
    month: int,
) -> dict:
    """
    Generate CA3 monthly TVA declaration summary.
    TVA collectée = TVA on sales (income)
    TVA déductible = TVA on purchases (expenses) that is recoverable
    """
    date_from = date(year, month, 1)
    import calendar
    last_day = calendar.monthrange(year, month)[1]
    date_to = date(year, month, last_day)

    transactions = (
        db.query(Transaction)
        .filter(
            Transaction.user_id == user_id,
            Transaction.jurisdiction == "france",
            Transaction.date >= date_from,
            Transaction.date <= date_to,
        )
        .all()
    )

    tva_collectee_by_rate = {}
    tva_deductible_by_rate = {}
    ca_ht = 0.0  # Chiffre d'affaires hors taxes

    for t in transactions:
        if t.type == "income":
            ca_ht += t.amount
        for tax in t.tax_entries:
            if tax.tax_type == "TVA":
                rate_key = f"{tax.rate}%"
                if t.type == "income":
                    tva_collectee_by_rate[rate_key] = (
                        tva_collectee_by_rate.get(rate_key, 0.0) + tax.amount
                    )
                elif t.type == "expense" and tax.recoverable:
                    tva_deductible_by_rate[rate_key] = (
                        tva_deductible_by_rate.get(rate_key, 0.0) + tax.amount
                    )

    total_tva_collectee = sum(tva_collectee_by_rate.values())
    total_tva_deductible = sum(tva_deductible_by_rate.values())
    tva_a_payer = round(total_tva_collectee - total_tva_deductible, 2)

    return {
        "year": year,
        "month": month,
        "period": f"{date_from} to {date_to}",
        "ca_ht": round(ca_ht, 2),
        "tva_collectee": {
            "by_rate": {k: round(v, 2) for k, v in tva_collectee_by_rate.items()},
            "total": round(total_tva_collectee, 2),
        },
        "tva_deductible": {
            "by_rate": {k: round(v, 2) for k, v in tva_deductible_by_rate.items()},
            "total": round(total_tva_deductible, 2),
        },
        "tva_a_payer": tva_a_payer,
        "credit_tva": abs(tva_a_payer) if tva_a_payer < 0 else 0.0,
        "transaction_count": len(transactions),
    }


def generate_fec_export(
    db: Session,
    user_id: int,
    year: int,
) -> str:
    """
    Generate FEC (Fichier des Écritures Comptables) export in DGFiP format.
    Returns CSV content as string.
    The FEC format uses pipe (|) as delimiter.
    """
    date_from = date(year, 1, 1)
    date_to = date(year, 12, 31)

    transactions = (
        db.query(Transaction)
        .filter(
            Transaction.user_id == user_id,
            Transaction.jurisdiction == "france",
            Transaction.date >= date_from,
            Transaction.date <= date_to,
        )
        .order_by(Transaction.date)
        .all()
    )

    output = io.StringIO()
    writer = csv.writer(output, delimiter="|")

    # FEC header columns (simplified DGFiP format)
    writer.writerow([
        "JournalCode",
        "JournalLib",
        "EcritureNum",
        "EcritureDate",
        "CompteNum",
        "CompteLib",
        "CompAuxNum",
        "CompAuxLib",
        "PieceRef",
        "PieceDate",
        "EcritureLib",
        "Debit",
        "Credit",
        "EcritureLet",
        "DateLet",
        "ValidDate",
        "Montantdevise",
        "Idevise",
    ])

    for idx, t in enumerate(transactions, 1):
        journal_code = "VT" if t.type == "income" else "AC"  # Ventes / Achats
        journal_lib = "Journal des ventes" if t.type == "income" else "Journal des achats"
        date_str = t.date.strftime("%Y%m%d")
        ecriture_num = f"{year}{idx:06d}"

        # Main entry: debit client/fournisseur, credit product account
        compte_num = "411000" if t.type == "income" else "401000"
        compte_lib = "Clients" if t.type == "income" else "Fournisseurs"
        total_ttc = t.amount + sum(tx.amount for tx in t.tax_entries if tx.tax_type == "TVA")

        writer.writerow([
            journal_code,
            journal_lib,
            ecriture_num,
            date_str,
            compte_num,
            compte_lib,
            "",
            "",
            str(t.id),
            date_str,
            t.description[:35],  # Max 35 chars for FEC
            f"{total_ttc:.2f}" if t.type == "income" else "0.00",
            "0.00" if t.type == "income" else f"{total_ttc:.2f}",
            "",
            "",
            date_str,
            f"{t.amount:.2f}",
            t.currency,
        ])

        # Product/charge account
        product_compte = "706000" if t.type == "income" else "606000"
        product_lib = "Prestations de services" if t.type == "income" else "Achats de services"
        writer.writerow([
            journal_code,
            journal_lib,
            ecriture_num,
            date_str,
            product_compte,
            product_lib,
            "",
            "",
            str(t.id),
            date_str,
            t.description[:35],
            "0.00" if t.type == "income" else f"{t.amount:.2f}",
            f"{t.amount:.2f}" if t.type == "income" else "0.00",
            "",
            "",
            date_str,
            f"{t.amount:.2f}",
            t.currency,
        ])

        # TVA entries
        for tax in t.tax_entries:
            if tax.tax_type == "TVA":
                if t.type == "income":
                    tva_compte = "445710"  # TVA collectée
                    tva_lib = "TVA collectée"
                    debit = "0.00"
                    credit = f"{tax.amount:.2f}"
                else:
                    tva_compte = "445660"  # TVA déductible
                    tva_lib = "TVA déductible sur ABS"
                    debit = f"{tax.amount:.2f}"
                    credit = "0.00"

                writer.writerow([
                    journal_code,
                    journal_lib,
                    ecriture_num,
                    date_str,
                    tva_compte,
                    tva_lib,
                    "",
                    "",
                    str(t.id),
                    date_str,
                    f"TVA {tax.rate}% - {t.description[:25]}",
                    debit,
                    credit,
                    "",
                    "",
                    date_str,
                    f"{tax.amount:.2f}",
                    t.currency,
                ])

    return output.getvalue()
