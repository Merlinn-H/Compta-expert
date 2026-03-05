from sqlalchemy import Boolean, Column, Enum, Float, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from app.db.database import Base


class TaxEntry(Base):
    __tablename__ = "tax_entries"

    id = Column(Integer, primary_key=True, index=True)
    transaction_id = Column(Integer, ForeignKey("transactions.id"), nullable=False)

    tax_type = Column(
        Enum("TPS", "TVQ", "TVA", name="tax_type_enum"), nullable=False
    )
    rate = Column(Float, nullable=False)  # e.g. 5.0, 9.975, 20.0
    amount = Column(Float, nullable=False)
    recoverable = Column(Boolean, default=False)  # CTI/RTI for Quebec, déductible for France

    transaction = relationship("Transaction", back_populates="tax_entries")
