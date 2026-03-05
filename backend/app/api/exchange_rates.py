from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, Query

from app.models.user import User
from app.services.auth import get_current_user
from app.services.exchange_rate import exchange_rate_service

router = APIRouter(prefix="/exchange-rates", tags=["exchange-rates"])


@router.get("/historical")
async def get_historical_rate(
    from_currency: str = Query(...),
    to_currency: str = Query(...),
    on_date: date = Query(...),
    _: User = Depends(get_current_user),
):
    """
    Fetch a historical exchange rate from Frankfurter API.
    Used for display/reference. Transaction creation fetches rates automatically.
    """
    rate = await exchange_rate_service.get_historical_rate(from_currency, to_currency, on_date)
    return {
        "from": from_currency,
        "to": to_currency,
        "date": str(on_date),
        "rate": rate,
        "label": (
            f"1 {from_currency} = {rate} {to_currency} — rate as of {on_date}"
            if rate else "Rate not available"
        ),
    }


@router.get("/latest")
async def get_latest_rate(
    from_currency: str = Query(...),
    to_currency: str = Query(...),
    _: User = Depends(get_current_user),
):
    rate = await exchange_rate_service.get_current_rate(from_currency, to_currency)
    return {
        "from": from_currency,
        "to": to_currency,
        "rate": rate,
        "note": "Current rate — for reference only. Transaction rates are always historical.",
    }
