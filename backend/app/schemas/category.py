from typing import Optional

from pydantic import BaseModel


class CategoryCreate(BaseModel):
    name: str
    name_fr: Optional[str] = None
    type: str  # income | expense
    jurisdiction: str = "both"  # quebec | france | both


class CategoryRead(BaseModel):
    id: int
    name: str
    name_fr: Optional[str]
    type: str
    jurisdiction: str

    class Config:
        from_attributes = True
