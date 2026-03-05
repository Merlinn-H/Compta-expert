from datetime import date
from typing import List, Optional

from sqlalchemy.orm import Session

from app.models.tax_entry import TaxEntry
from app.models.transaction import Transaction
from app.schemas.transaction import TransactionCreate, TransactionUpdate
from app.services.exchange_rate import exchange_rate_service


async def create_transaction(
    db: Session, user_id: int, data: TransactionCreate
) -> Transaction:
    """
    Create a transaction and fetch + store the historical exchange rate at transaction date.
    The rate is fetched ONCE and stored — it will never be recalculated.
    """
    exchange_rate = None
    converted_amount = None
    target_currency = data.target_currency

    # Determine target currency: if same as source, no conversion needed
    if target_currency and target_currency != data.currency:
        rate = await exchange_rate_service.get_historical_rate(
            from_currency=data.currency,
            to_currency=target_currency,
            on_date=data.date,
        )
        if rate is not None:
            exchange_rate = rate
            converted_amount = round(data.amount * rate, 4)
    elif not target_currency:
        # Auto-set target currency: CAD transactions convert to EUR and vice versa
        if data.currency == "CAD":
            target_currency = "EUR"
        elif data.currency == "EUR":
            target_currency = "CAD"

        if target_currency:
            rate = await exchange_rate_service.get_historical_rate(
                from_currency=data.currency,
                to_currency=target_currency,
                on_date=data.date,
            )
            if rate is not None:
                exchange_rate = rate
                converted_amount = round(data.amount * rate, 4)

    transaction = Transaction(
        user_id=user_id,
        date=data.date,
        description=data.description,
        notes=data.notes,
        amount=data.amount,
        currency=data.currency,
        target_currency=target_currency,
        exchange_rate_at_date=exchange_rate,
        converted_amount=converted_amount,
        jurisdiction=data.jurisdiction,
        type=data.type,
        category_id=data.category_id,
    )
    db.add(transaction)
    db.flush()  # get ID without committing

    # Create tax entries
    for tax_data in (data.tax_entries or []):
        tax_entry = TaxEntry(
            transaction_id=transaction.id,
            tax_type=tax_data.tax_type,
            rate=tax_data.rate,
            amount=tax_data.amount,
            recoverable=tax_data.recoverable,
        )
        db.add(tax_entry)

    db.commit()
    db.refresh(transaction)
    return transaction


def get_transactions(
    db: Session,
    user_id: int,
    jurisdiction: Optional[str] = None,
    type: Optional[str] = None,
    currency: Optional[str] = None,
    category_id: Optional[int] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    skip: int = 0,
    limit: int = 100,
) -> List[Transaction]:
    query = db.query(Transaction).filter(Transaction.user_id == user_id)

    if jurisdiction:
        query = query.filter(Transaction.jurisdiction == jurisdiction)
    if type:
        query = query.filter(Transaction.type == type)
    if currency:
        query = query.filter(Transaction.currency == currency)
    if category_id:
        query = query.filter(Transaction.category_id == category_id)
    if date_from:
        query = query.filter(Transaction.date >= date_from)
    if date_to:
        query = query.filter(Transaction.date <= date_to)

    return query.order_by(Transaction.date.desc()).offset(skip).limit(limit).all()


def get_transaction(db: Session, transaction_id: int, user_id: int) -> Optional[Transaction]:
    return (
        db.query(Transaction)
        .filter(Transaction.id == transaction_id, Transaction.user_id == user_id)
        .first()
    )


def update_transaction(
    db: Session, transaction: Transaction, data: TransactionUpdate
) -> Transaction:
    """
    Update a transaction. Historical exchange rate is NEVER modified here.
    """
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(transaction, field, value)
    db.commit()
    db.refresh(transaction)
    return transaction


def delete_transaction(db: Session, transaction: Transaction) -> None:
    db.delete(transaction)
    db.commit()
