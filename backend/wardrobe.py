import os

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from auth import get_current_user
from database import get_db
from image_utils import (
    check_file_size,
    detect_image_type,
    generate_filename,
    strip_exif,
    validate_image,
)
from models import ClothingItem, User

VALID_CATEGORIES = {"Oberteil", "Hose", "Schuhe", "Accessoire", "Kleid", "Jacke"}
UPLOAD_DIR = "uploads"

wardrobe_router = APIRouter(tags=["wardrobe"])


def _ensure_upload_dir() -> None:
    os.makedirs(UPLOAD_DIR, exist_ok=True)


def _item_to_dict(item: ClothingItem) -> dict:
    return {
        "id": item.id,
        "name": item.name,
        "category": item.category,
        "image_url": f"/api/images/{item.image_filename}",
        "created_at": item.created_at,
    }


@wardrobe_router.get("/api/wardrobe")
def list_items(
    category: str | None = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(ClothingItem).filter(ClothingItem.user_id == current_user.id)
    if category:
        query = query.filter(ClothingItem.category == category)
    items = query.order_by(ClothingItem.created_at.desc()).all()
    return [_item_to_dict(item) for item in items]


@wardrobe_router.post("/api/wardrobe", status_code=201)
async def create_item(
    name: str = Form(...),
    category: str = Form(...),
    image: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if category not in VALID_CATEGORIES:
        raise HTTPException(status_code=422, detail="Ungültige Kategorie")

    if not await validate_image(image):
        raise HTTPException(status_code=422, detail="Ungültiges Bildformat")

    if not await check_file_size(image):
        raise HTTPException(status_code=422, detail="Bild zu groß (max. 10 MB)")

    _ensure_upload_dir()
    filename = generate_filename(image.filename or "image.jpg")
    file_path = os.path.join(UPLOAD_DIR, filename)

    contents = await image.read()
    with open(file_path, "wb") as f:
        f.write(contents)

    strip_exif(file_path)

    item = ClothingItem(
        user_id=current_user.id,
        name=name,
        category=category,
        image_filename=filename,
    )
    db.add(item)
    db.commit()
    db.refresh(item)

    return _item_to_dict(item)


@wardrobe_router.delete("/api/wardrobe/{item_id}", status_code=204)
def delete_item(
    item_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    item = db.query(ClothingItem).filter(ClothingItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Kleidungsstück nicht gefunden")
    if item.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Kein Zugriff")

    file_path = os.path.join(UPLOAD_DIR, item.image_filename)
    if os.path.exists(file_path):
        os.remove(file_path)

    db.delete(item)
    db.commit()
    return None


@wardrobe_router.get("/api/images/{filename}")
def serve_image(
    filename: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if ".." in filename or "/" in filename or "\\" in filename:
        raise HTTPException(status_code=422, detail="Ungültiger Dateiname")

    file_path = os.path.abspath(os.path.join(UPLOAD_DIR, filename))
    allowed_dir = os.path.abspath(UPLOAD_DIR)

    if not file_path.startswith(allowed_dir + os.sep) or not os.path.isfile(file_path):
        raise HTTPException(status_code=404, detail="Bild nicht gefunden")

    item = (
        db.query(ClothingItem)
        .filter(
            ClothingItem.image_filename == filename,
            ClothingItem.user_id == current_user.id,
        )
        .first()
    )
    if not item:
        raise HTTPException(status_code=404, detail="Bild nicht gefunden")

    media_type = detect_image_type(file_path)
    return FileResponse(file_path, media_type=media_type)
