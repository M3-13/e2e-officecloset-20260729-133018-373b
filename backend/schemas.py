from datetime import datetime

from pydantic import BaseModel, Field, field_validator


class UserCreate(BaseModel):
    email: str
    password: str
    privacy_accepted: bool = Field(
        ..., description="Bestätigung der Datenschutzerklärung - muss true sein"
    )

    @field_validator("privacy_accepted")
    @classmethod
    def must_be_true(cls, v: bool) -> bool:
        if v is not True:
            raise ValueError("Datenschutzerklärung muss akzeptiert werden")
        return v


class UserLogin(BaseModel):
    email: str
    password: str


class UserResponse(BaseModel):
    id: int
    email: str

    model_config = {"from_attributes": True}


class ClothingItemCreate(BaseModel):
    name: str
    category: str


class ClothingItemResponse(BaseModel):
    id: int
    name: str
    category: str
    image_url: str
    created_at: datetime

    model_config = {"from_attributes": True}


class OutfitCreate(BaseModel):
    name: str
    item_ids: list[int]


class OutfitResponse(BaseModel):
    id: int
    name: str
    items: list[ClothingItemResponse]
    created_at: datetime

    model_config = {"from_attributes": True}
