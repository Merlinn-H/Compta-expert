from typing import List, Optional
from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.user import User
from app.schemas.transaction import TransactionCreate, TransactionRead, TransactionUpdate
from app.services.auth import get_current_user
from app.services.transaction import (
    create_transaction,
    delete_transaction,
    get_transaction,
    get_transactions,
    update_transaction,
)

router = APIRouter(prefix="/transactions", tags=["transactions"])


@router.post("/", response_model=TransactionRead, status_code=status.HTTP_201_CREATED)
async def create(
    data: TransactionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return await create_transaction(db, current_user.id, data)


@router.get("/", response_model=List[TransactionRead])
def list_transactions(
    jurisdiction: Optional[str] = Query(None),
    type: Optional[str] = Query(None),
    currency: Optional[str] = Query(None),
    category_id: Optional[int] = Query(None),
    date_from: Optional[date] = Query(None),
    date_to: Optional[date] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return get_transactions(
        db,
        current_user.id,
        jurisdiction=jurisdiction,
        type=type,
        currency=currency,
        category_id=category_id,
        date_from=date_from,
        date_to=date_to,
        skip=skip,
        limit=limit,
    )


@router.get("/{transaction_id}", response_model=TransactionRead)
def get_one(
    transaction_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    t = get_transaction(db, transaction_id, current_user.id)
    if not t:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return t


@router.put("/{transaction_id}", response_model=TransactionRead)
def update(
    transaction_id: int,
    data: TransactionUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    t = get_transaction(db, transaction_id, current_user.id)
    if not t:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return update_transaction(db, t, data)


@router.delete("/{transaction_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete(
    transaction_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    t = get_transaction(db, transaction_id, current_user.id)
    if not t:
        raise HTTPException(status_code=404, detail="Transaction not found")
    delete_transaction(db, t)
