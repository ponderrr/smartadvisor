# api/app/api/v1/endpoints/saved_items.py
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
import json

from app.api.deps import get_current_active_user, get_db
from app.models.user import User
from app.models.saved_item import SavedItem  # You'll need to create this model
from app.crud import saved_item as crud_saved_item  # You'll need to create this CRUD

router = APIRouter()


# Pydantic models for request/response
class SaveItemRequest(BaseModel):
    item_id: str
    item_type: str  # "movie" or "book"
    item_title: str
    item_data: dict  # Full movie/book data


class SavedItemResponse(BaseModel):
    id: str
    user_id: str
    item_id: str
    item_type: str
    item_title: str
    item_data: dict
    created_at: str

    class Config:
        from_attributes = True


class SavedItemsListResponse(BaseModel):
    items: List[SavedItemResponse]
    total: int
    skip: int
    limit: int


class ItemSavedCheckResponse(BaseModel):
    is_saved: bool


@router.post("/saved-items", response_model=SavedItemResponse)
def save_item(
    request: SaveItemRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Save an item to user's saved list"""

    # Check if item is already saved
    existing = crud_saved_item.get_saved_item(
        db=db,
        user_id=current_user.id,
        item_id=request.item_id,
        item_type=request.item_type,
    )

    if existing:
        raise HTTPException(status_code=400, detail="Item is already saved")

    # Create new saved item
    saved_item = crud_saved_item.create_saved_item(
        db=db,
        user_id=current_user.id,
        item_id=request.item_id,
        item_type=request.item_type,
        item_title=request.item_title,
        item_data=request.item_data,
    )

    return saved_item


@router.delete("/saved-items/{item_id}")
def unsave_item(
    item_id: str,
    item_type: str = Query(..., description="Type of item: movie or book"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Remove an item from user's saved list"""

    saved_item = crud_saved_item.get_saved_item(
        db=db, user_id=current_user.id, item_id=item_id, item_type=item_type
    )

    if not saved_item:
        raise HTTPException(status_code=404, detail="Saved item not found")

    crud_saved_item.delete_saved_item(db=db, saved_item_id=saved_item.id)

    return {"message": "Item removed from saved list"}


@router.get("/saved-items", response_model=SavedItemsListResponse)
def get_saved_items(
    item_type: Optional[str] = Query(
        None, description="Filter by item type: movie or book"
    ),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get user's saved items"""

    saved_items = crud_saved_item.get_user_saved_items(
        db=db, user_id=current_user.id, item_type=item_type, skip=skip, limit=limit
    )

    total = crud_saved_item.count_user_saved_items(
        db=db, user_id=current_user.id, item_type=item_type
    )

    return SavedItemsListResponse(
        items=saved_items, total=total, skip=skip, limit=limit
    )


@router.get("/saved-items/{item_id}/check", response_model=ItemSavedCheckResponse)
def check_item_saved(
    item_id: str,
    item_type: str = Query(..., description="Type of item: movie or book"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Check if an item is saved by the user"""

    saved_item = crud_saved_item.get_saved_item(
        db=db, user_id=current_user.id, item_id=item_id, item_type=item_type
    )

    return ItemSavedCheckResponse(is_saved=saved_item is not None)
