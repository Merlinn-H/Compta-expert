from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.user import User
from app.services.auth import get_current_user
from app.services.reporting import export_pnl_pdf, export_transactions_csv, get_pnl

router = APIRouter(prefix="/reports", tags=["reports"])


@router.get("/pnl")
def profit_and_loss(
    date_from: date = Query(...),
    date_to: date = Query(...),
    jurisdiction: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return get_pnl(db, current_user.id, date_from, date_to, jurisdiction)


@router.get("/pnl/pdf")
def profit_and_loss_pdf(
    date_from: date = Query(...),
    date_to: date = Query(...),
    jurisdiction: Optional[str] = Query(None),
    language: str = Query("fr"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    pdf_bytes = export_pnl_pdf(
        db, current_user.id, date_from, date_to, jurisdiction, language
    )
    filename = f"PnL_{date_from}_{date_to}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/transactions/csv")
def transactions_csv(
    date_from: Optional[date] = Query(None),
    date_to: Optional[date] = Query(None),
    jurisdiction: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    csv_content = export_transactions_csv(
        db, current_user.id, date_from, date_to, jurisdiction
    )
    filename = f"transactions_{current_user.id}.csv"
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
