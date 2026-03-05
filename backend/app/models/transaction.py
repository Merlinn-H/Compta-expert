from datetime import datetime, timezone

from sqlalchemy import Column, Date, DateTime, Enum, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.db.database import Base


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=True)

    date = Column(Date, nullable=False)
    description = Column(String, nullable=False)
    notes = Column(Text, nullable=True)

    # Original amount as entered
    amount = Column(Float, nullable=False)
    currency = Column(Enum("CAD", "EUR", "USD", "GBP", name="currency_full_enum"), nullable=False)

    # Converted amount using historical rate
    target_currency = Column(
        Enum("CAD", "EUR", "USD", "GBP", name="target_currency_enum"), nullable=True
    )
    exchange_rate_at_date = Column(Float, nullable=True)  # rate on transaction date
    converted_amount = Column(Float, nullable=True)

    jurisdiction = Column(
        Enum("quebec", "france", name="transaction_jurisdiction_enum"), nullable=False
    )
    type = Column(Enum("income", "expense", name="transaction_type_enum"), nullable=False)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    user = relationship("User", back_populates="transactions")
    category = relationship("Category", back_populates="transactions")
    tax_entries = relationship("TaxEntry", back_populates="transaction", cascade="all, delete-orphan")
