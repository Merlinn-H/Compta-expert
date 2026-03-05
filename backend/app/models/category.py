from sqlalchemy import Column, Enum, Integer, String
from sqlalchemy.orm import relationship

from app.db.database import Base


class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    name_fr = Column(String, nullable=True)
    type = Column(Enum("income", "expense", name="category_type_enum"), nullable=False)
    jurisdiction = Column(
        Enum("quebec", "france", "both", name="jurisdiction_enum"), default="both"
    )

    transactions = relationship("Transaction", back_populates="category")
