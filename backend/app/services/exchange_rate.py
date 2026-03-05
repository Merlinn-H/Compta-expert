"""
Exchange rate service using the Frankfurter API (free, no key required).
CRITICAL: Always uses historical rates at the transaction date — never current rates.
"""

from datetime import date
from typing import Optional

import httpx

from app.core.config import settings


class ExchangeRateService:
    BASE_URL = settings.FRANKFURTER_API_URL

    async def get_historical_rate(
        self, from_currency: str, to_currency: str, on_date: date
    ) -> Optional[float]:
        """
        Fetch the exchange rate from `from_currency` to `to_currency` on a specific date.
        Returns None if the currencies are the same or if the API call fails.

        This is the ONLY method that should be used for exchange rate lookups.
        The rate is fetched once at transaction creation time and stored permanently.
        """
        if from_currency == to_currency:
            return 1.0

        date_str = on_date.strftime("%Y-%m-%d")
        url = f"{self.BASE_URL}/{date_str}"

        async with httpx.AsyncClient() as client:
            try:
                # Frankfurter API returns 200 even for weekends — it uses the last available rate
                response = await client.get(
                    url,
                    params={"from": from_currency, "to": to_currency},
                    timeout=10.0,
                )
                response.raise_for_status()
                data = response.json()
                rate = data.get("rates", {}).get(to_currency)
                return float(rate) if rate is not None else None
            except (httpx.HTTPError, KeyError, ValueError):
                return None

    async def get_current_rate(self, from_currency: str, to_currency: str) -> Optional[float]:
        """
        Fetch the most recent available rate. Used only for display/reference purposes,
        NEVER for storing on transactions.
        """
        if from_currency == to_currency:
            return 1.0

        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(
                    f"{self.BASE_URL}/latest",
                    params={"from": from_currency, "to": to_currency},
                    timeout=10.0,
                )
                response.raise_for_status()
                data = response.json()
                rate = data.get("rates", {}).get(to_currency)
                return float(rate) if rate is not None else None
            except (httpx.HTTPError, KeyError, ValueError):
                return None


exchange_rate_service = ExchangeRateService()
