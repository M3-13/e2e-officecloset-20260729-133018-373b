import os
import re
import uuid
from datetime import UTC, datetime, timedelta

import bcrypt
from fastapi import APIRouter, Depends, HTTPException, Request, Response
from sqlalchemy.orm import Session

from database import get_db
from models import ClothingItem, User
from models import Session as SessionModel
from schemas import UserCreate, UserLogin, UserResponse


def _utcnow() -> datetime:
    return datetime.now(UTC).replace(tzinfo=None)


auth_router = APIRouter(prefix="/api/auth", tags=["auth"])

SESSION_COOKIE = "session_token"

COOKIE_KWARGS = {"httponly": True, "secure": True, "samesite": "strict"}


def _hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt(rounds=12)).decode("utf-8")


def _verify_password(password: str, password_hash: str) -> bool:
    return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))


_EMAIL_RE = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")


def _validate_email(email: str) -> None:
    if not _EMAIL_RE.match(email):
        raise HTTPException(status_code=422, detail="Ungültige E-Mail-Adresse")


def get_current_user(
    request: Request,
    db: Session = Depends(get_db),
) -> User:
    token = request.cookies.get(SESSION_COOKIE)
    if not token:
        raise HTTPException(status_code=401, detail="Nicht authentifiziert")
    session = db.query(SessionModel).filter(SessionModel.token == token).first()
    if not session:
        raise HTTPException(status_code=401, detail="Ungültige Sitzung")
    if session.expires_at < _utcnow():
        db.delete(session)
        db.commit()
        raise HTTPException(status_code=401, detail="Sitzung abgelaufen")
    user = db.query(User).filter(User.id == session.user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="Benutzer nicht gefunden")
    return user


@auth_router.post("/register", status_code=201, response_model=UserResponse)
def register(payload: UserCreate, response: Response, db: Session = Depends(get_db)):
    _validate_email(payload.email)
    if len(payload.password) < 8:
        raise HTTPException(status_code=422, detail="Passwort muss mindestens 8 Zeichen lang sein")

    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=409, detail="E-Mail bereits registriert")

    user = User(
        email=payload.email,
        password_hash=_hash_password(payload.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    session_token = str(uuid.uuid4())
    session = SessionModel(
        token=session_token,
        user_id=user.id,
        expires_at=_utcnow() + timedelta(hours=24),
    )
    db.add(session)
    db.commit()

    response.set_cookie(
        key=SESSION_COOKIE,
        value=session_token,
        **COOKIE_KWARGS,
    )

    return user


@auth_router.post("/login", response_model=UserResponse)
def login(payload: UserLogin, response: Response, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not _verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="E-Mail oder Passwort falsch")

    session_token = str(uuid.uuid4())
    session = SessionModel(
        token=session_token,
        user_id=user.id,
        expires_at=_utcnow() + timedelta(hours=24),
    )
    db.add(session)
    db.commit()

    response.set_cookie(
        key=SESSION_COOKIE,
        value=session_token,
        **COOKIE_KWARGS,
    )

    return user


@auth_router.post("/logout", status_code=204)
def logout(
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
):
    token = request.cookies.get(SESSION_COOKIE)
    if token:
        db.query(SessionModel).filter(SessionModel.token == token).delete()
        db.commit()

    response.delete_cookie(
        key=SESSION_COOKIE,
        **COOKIE_KWARGS,
    )
    return None


@auth_router.get("/me", response_model=UserResponse)
def me(current_user: User = Depends(get_current_user)):
    return current_user


UPLOAD_DIR = "uploads"


@auth_router.delete("/me", status_code=204)
def delete_account(
    request: Request,
    response: Response,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    items = db.query(ClothingItem).filter(ClothingItem.user_id == current_user.id).all()
    for item in items:
        file_path = os.path.join(UPLOAD_DIR, item.image_filename)
        if os.path.exists(file_path):
            os.remove(file_path)

    db.delete(current_user)
    db.commit()

    response.delete_cookie(
        key=SESSION_COOKIE,
        **COOKIE_KWARGS,
    )
    return None
