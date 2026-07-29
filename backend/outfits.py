from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from auth import get_current_user
from database import get_db
from models import ClothingItem, Outfit, OutfitItem, User
from schemas import OutfitCreate, OutfitResponse

outfit_router = APIRouter(prefix="/api/outfits", tags=["outfits"])


def _build_outfit_response(outfit: Outfit) -> dict:
    items = sorted(outfit.outfit_items, key=lambda oi: oi.position_order)
    clothing_items = [oi.clothing_item for oi in items]
    return {
        "id": outfit.id,
        "name": outfit.name,
        "created_at": outfit.created_at,
        "items": [
            {
                "id": ci.id,
                "name": ci.name,
                "category": ci.category,
                "image_url": f"/api/images/{ci.image_filename}",
                "created_at": ci.created_at,
            }
            for ci in clothing_items
        ],
    }


@outfit_router.post("", status_code=201, response_model=OutfitResponse)
def create_outfit(
    payload: OutfitCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not payload.name.strip():
        raise HTTPException(status_code=422, detail="Name ist erforderlich")
    if len(payload.item_ids) < 2:
        raise HTTPException(status_code=422, detail="Mindestens 2 Items erforderlich")

    items = db.query(ClothingItem).filter(ClothingItem.id.in_(payload.item_ids)).all()
    if len(items) != len(payload.item_ids):
        raise HTTPException(status_code=422, detail="Ein oder mehrere Items nicht gefunden")

    for item in items:
        if item.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Ein Item gehört nicht dem Benutzer")

    outfit = Outfit(name=payload.name.strip(), user_id=current_user.id)
    db.add(outfit)
    db.flush()

    for position, item_id in enumerate(payload.item_ids):
        outfit_item = OutfitItem(
            outfit_id=outfit.id,
            clothing_item_id=item_id,
            position_order=position,
        )
        db.add(outfit_item)

    db.commit()
    db.refresh(outfit)
    return _build_outfit_response(outfit)


@outfit_router.get("", response_model=list[OutfitResponse])
def list_outfits(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    outfits = db.query(Outfit).filter(Outfit.user_id == current_user.id).all()
    return [_build_outfit_response(o) for o in outfits]


@outfit_router.delete("/{outfit_id}", status_code=204)
def delete_outfit(
    outfit_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    outfit = db.query(Outfit).filter(Outfit.id == outfit_id).first()
    if not outfit:
        raise HTTPException(status_code=404, detail="Outfit nicht gefunden")
    if outfit.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Keine Berechtigung")

    db.delete(outfit)
    db.commit()
    return None
