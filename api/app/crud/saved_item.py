# api/app/crud/saved_item.py
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import and_, func
import json

from app.models.saved_item import SavedItem


def create_saved_item(
    db: Session,
    *,
    user_id: str,
    item_id: str,
    item_type: str,
    item_title: str,
    item_data: dict
) -> SavedItem:
    """Create a new saved item"""

    saved_item = SavedItem(
        user_id=user_id,
        item_id=item_id,
        item_type=item_type,
        item_title=item_title,
        item_data=json.dumps(item_data),  # Store as JSON string
    )

    db.add(saved_item)
    db.commit()
    db.refresh(saved_item)

    return saved_item


def get_saved_item(
    db: Session, *, user_id: str, item_id: str, item_type: str
) -> Optional[SavedItem]:
    """Get a specific saved item"""

    return (
        db.query(SavedItem)
        .filter(
            and_(
                SavedItem.user_id == user_id,
                SavedItem.item_id == item_id,
                SavedItem.item_type == item_type,
            )
        )
        .first()
    )


def get_user_saved_items(
    db: Session,
    *,
    user_id: str,
    item_type: Optional[str] = None,
    skip: int = 0,
    limit: int = 50
) -> List[SavedItem]:
    """Get user's saved items with optional filtering"""

    query = db.query(SavedItem).filter(SavedItem.user_id == user_id)

    if item_type:
        query = query.filter(SavedItem.item_type == item_type)

    return query.order_by(SavedItem.created_at.desc()).offset(skip).limit(limit).all()


def count_user_saved_items(
    db: Session, *, user_id: str, item_type: Optional[str] = None
) -> int:
    """Count user's saved items"""

    query = db.query(func.count(SavedItem.id)).filter(SavedItem.user_id == user_id)

    if item_type:
        query = query.filter(SavedItem.item_type == item_type)

    return query.scalar()


def delete_saved_item(db: Session, *, saved_item_id: str) -> bool:
    """Delete a saved item"""

    saved_item = db.query(SavedItem).filter(SavedItem.id == saved_item_id).first()

    if saved_item:
        db.delete(saved_item)
        db.commit()
        return True

    return False


def delete_user_saved_item(
    db: Session, *, user_id: str, item_id: str, item_type: str
) -> bool:
    """Delete a specific user's saved item"""

    saved_item = get_saved_item(
        db=db, user_id=user_id, item_id=item_id, item_type=item_type
    )

    if saved_item:
        db.delete(saved_item)
        db.commit()
        return True

    return False
