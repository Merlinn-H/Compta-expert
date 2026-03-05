"""
Reporting service: P&L, Balance Sheet, PDF/CSV export.
All reports display original + converted amounts with historical rates.
"""

import csv
import io
from datetime import date
from typing import Optional

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.platypus import (
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)
from sqlalchemy.orm import Session

from app.models.transaction import Transaction


def get_pnl(
    db: Session,
    user_id: int,
    date_from: date,
    date_to: date,
    jurisdiction: Optional[str] = None,
) -> dict:
    query = (
        db.query(Transaction)
        .filter(
            Transaction.user_id == user_id,
            Transaction.date >= date_from,
            Transaction.date <= date_to,
        )
    )
    if jurisdiction:
        query = query.filter(Transaction.jurisdiction == jurisdiction)

    transactions = query.order_by(Transaction.date).all()

    income_lines = []
    expense_lines = []
    total_income = 0.0
    total_expenses = 0.0

    for t in transactions:
        line = {
            "id": t.id,
            "date": str(t.date),
            "description": t.description,
            "jurisdiction": t.jurisdiction,
            "original_amount": t.amount,
            "original_currency": t.currency,
            "converted_amount": t.converted_amount,
            "target_currency": t.target_currency,
            "exchange_rate": t.exchange_rate_at_date,
            "rate_label": (
                f"1 {t.currency} = {t.exchange_rate_at_date} {t.target_currency} — taux au {t.date}"
                if t.exchange_rate_at_date
                else None
            ),
        }
        if t.type == "income":
            income_lines.append(line)
            total_income += t.amount
        else:
            expense_lines.append(line)
            total_expenses += t.amount

    return {
        "period": {"from": str(date_from), "to": str(date_to)},
        "jurisdiction": jurisdiction or "all",
        "income": {
            "lines": income_lines,
            "total": round(total_income, 2),
        },
        "expenses": {
            "lines": expense_lines,
            "total": round(total_expenses, 2),
        },
        "net": round(total_income - total_expenses, 2),
        "transaction_count": len(transactions),
    }


def export_transactions_csv(
    db: Session,
    user_id: int,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    jurisdiction: Optional[str] = None,
) -> str:
    query = db.query(Transaction).filter(Transaction.user_id == user_id)
    if date_from:
        query = query.filter(Transaction.date >= date_from)
    if date_to:
        query = query.filter(Transaction.date <= date_to)
    if jurisdiction:
        query = query.filter(Transaction.jurisdiction == jurisdiction)

    transactions = query.order_by(Transaction.date).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "ID", "Date", "Description", "Type", "Jurisdiction",
        "Original Amount", "Original Currency",
        "Converted Amount", "Target Currency",
        "Exchange Rate", "Rate Date", "Rate Label",
        "Notes", "Category",
    ])

    for t in transactions:
        rate_label = (
            f"1 {t.currency} = {t.exchange_rate_at_date} {t.target_currency} — rate as of {t.date}"
            if t.exchange_rate_at_date else ""
        )
        writer.writerow([
            t.id,
            t.date,
            t.description,
            t.type,
            t.jurisdiction,
            t.amount,
            t.currency,
            t.converted_amount or "",
            t.target_currency or "",
            t.exchange_rate_at_date or "",
            t.date if t.exchange_rate_at_date else "",
            rate_label,
            t.notes or "",
            t.category.name if t.category else "",
        ])

    return output.getvalue()


def export_pnl_pdf(
    db: Session,
    user_id: int,
    date_from: date,
    date_to: date,
    jurisdiction: Optional[str] = None,
    language: str = "fr",
) -> bytes:
    pnl = get_pnl(db, user_id, date_from, date_to, jurisdiction)

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=2*cm, leftMargin=2*cm,
                            topMargin=2*cm, bottomMargin=2*cm)

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle("Title", parent=styles["Title"], fontSize=16, spaceAfter=20)
    heading_style = ParagraphStyle("Heading", parent=styles["Heading2"], fontSize=12, spaceAfter=10)
    small_style = ParagraphStyle("Small", parent=styles["Normal"], fontSize=8, textColor=colors.grey)

    if language == "fr":
        title_text = "Compte de Résultat"
        income_text = "Produits (Revenus)"
        expense_text = "Charges (Dépenses)"
        net_text = "Résultat Net"
        headers = ["Date", "Description", "Montant Original", "Montant Converti", "Taux de change"]
    else:
        title_text = "Profit & Loss Statement"
        income_text = "Income"
        expense_text = "Expenses"
        net_text = "Net Result"
        headers = ["Date", "Description", "Original Amount", "Converted Amount", "Exchange Rate"]

    story = []
    story.append(Paragraph(title_text, title_style))
    story.append(Paragraph(f"{pnl['period']['from']} → {pnl['period']['to']}", styles["Normal"]))
    story.append(Spacer(1, 0.5*cm))

    def build_table(lines, title, total, is_income=True):
        story.append(Paragraph(title, heading_style))
        color = colors.HexColor("#16a34a") if is_income else colors.HexColor("#dc2626")

        table_data = [headers]
        for line in lines:
            rate_label = (
                f"1 {line['original_currency']} = {line['exchange_rate']:.4f} {line['target_currency']}"
                if line.get("exchange_rate") else "—"
            )
            converted_str = (
                f"{line['converted_amount']:.2f} {line['target_currency']}"
                if line.get("converted_amount") else "—"
            )
            table_data.append([
                line["date"],
                line["description"][:40],
                f"{line['original_amount']:.2f} {line['original_currency']}",
                converted_str,
                rate_label,
            ])

        # Total row
        table_data.append(["", f"TOTAL", f"{total:.2f}", "", ""])

        col_widths = [2.5*cm, 6*cm, 3.5*cm, 3.5*cm, 5*cm]
        t = Table(table_data, colWidths=col_widths)
        t.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1e293b")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, -1), 8),
            ("ROWBACKGROUNDS", (0, 1), (-1, -2), [colors.white, colors.HexColor("#f8fafc")]),
            ("BACKGROUND", (0, -1), (-1, -1), colors.HexColor("#f1f5f9")),
            ("FONTNAME", (0, -1), (-1, -1), "Helvetica-Bold"),
            ("TEXTCOLOR", (1, -1), (1, -1), color),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
            ("PADDING", (0, 0), (-1, -1), 4),
        ]))
        story.append(t)
        story.append(Spacer(1, 0.5*cm))

    build_table(pnl["income"]["lines"], income_text, pnl["income"]["total"], is_income=True)
    build_table(pnl["expenses"]["lines"], expense_text, pnl["expenses"]["total"], is_income=False)

    # Net result
    net_color = colors.HexColor("#16a34a") if pnl["net"] >= 0 else colors.HexColor("#dc2626")
    net_data = [
        [net_text, f"{pnl['net']:.2f}"],
    ]
    net_table = Table(net_data, colWidths=[10*cm, 4*cm])
    net_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#1e293b")),
        ("TEXTCOLOR", (0, 0), (-1, -1), colors.white),
        ("TEXTCOLOR", (1, 0), (1, 0), net_color),
        ("FONTNAME", (0, 0), (-1, -1), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 12),
        ("PADDING", (0, 0), (-1, -1), 8),
    ]))
    story.append(net_table)
    story.append(Spacer(1, 1*cm))
    story.append(Paragraph(
        "* Les taux de change utilisés sont les taux historiques à la date de chaque transaction (source: Frankfurter API). "
        "Ces taux sont stockés de manière permanente et ne sont jamais recalculés.",
        small_style
    ))

    doc.build(story)
    return buffer.getvalue()
