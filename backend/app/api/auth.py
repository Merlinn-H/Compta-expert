from fastapi import APIRouter, Depends, Request
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlalchemy.orm import Session

from app.core.security import create_access_token
from app.db.database import get_db
from app.schemas.user import LoginRequest, Token, UserCreate, UserRead, UserUpdate
from app.services.auth import authenticate_user, create_user, get_current_user
from app.models.user import User
from fastapi import HTTPException, status

limiter = Limiter(key_func=get_remote_address)
router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=Token)
@limiter.limit("10/minute")
def register(request: Request, user_data: UserCreate, db: Session = Depends(get_db)):
    user = create_user(db, user_data)
    token = create_access_token({"sub": str(user.id)})
    return Token(access_token=token, token_type="bearer", user=UserRead.model_validate(user))


@router.post("/login", response_model=Token)
@limiter.limit("20/minute")
def login(request: Request, credentials: LoginRequest, db: Session = Depends(get_db)):
    user = authenticate_user(db, credentials.email, credentials.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
    token = create_access_token({"sub": str(user.id)})
    return Token(access_token=token, token_type="bearer", user=UserRead.model_validate(user))


@router.get("/me", response_model=UserRead)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.put("/me", response_model=UserRead)
def update_me(
    data: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(current_user, field, value)
    db.commit()
    db.refresh(current_user)
    return current_user
