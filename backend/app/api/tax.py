from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.user import User
from app.services.auth import get_current_user
from app.services.tax_quebec import get_quarterly_summary, get_annual_payroll_summary
from app.services.tax_france import get_ca3_summary, generate_fec_export

router = APIRouter(prefix="/tax", tags=["tax"])


# ── Quebec ────────────────────────────────────────────────────────────────────

@router.get("/quebec/quarterly")
def quebec_quarterly(
    year: int = Query(...),
    quarter: int = Query(..., ge=1, le=4),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return get_quarterly_summary(db, current_user.id, year, quarter)


@router.get("/quebec/payroll")
def quebec_payroll(
    year: int = Query(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return get_annual_payroll_summary(db, current_user.id, year)


# ── France ────────────────────────────────────────────────────────────────────

@router.get("/france/ca3")
def france_ca3(
    year: int = Query(...),
    month: int = Query(..., ge=1, le=12),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return get_ca3_summary(db, current_user.id, year, month)


@router.get("/france/fec")
def france_fec(
    year: int = Query(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    content = generate_fec_export(db, current_user.id, year)
    filename = f"FEC_{year}_{current_user.id}.txt"
    return Response(
        content=content,
        media_type="text/plain",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
