from typing import Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.models.category import Category
from app.schemas.category import CategoryCreate, CategoryUpdate


class CategoryRepository:
    """Data Access Layer for Category entity."""

    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, category_id: int) -> Optional[Category]:
        return self.db.get(Category, category_id)

    def get_by_name(self, name: str) -> Optional[Category]:
        stmt = select(Category).where(Category.name.ilike(name.strip()))
        return self.db.execute(stmt).scalar_one_or_none()

    def create(self, category_in: CategoryCreate) -> Category:
        db_category = Category(
            name=category_in.name.strip(),
            description=category_in.description
        )
        self.db.add(db_category)
        self.db.commit()
        self.db.refresh(db_category)
        return db_category

    def update(self, db_category: Category, category_in: CategoryUpdate) -> Category:
        update_data = category_in.model_dump(exclude_unset=True)
        if "name" in update_data and update_data["name"]:
            update_data["name"] = update_data["name"].strip()
        for field, value in update_data.items():
            setattr(db_category, field, value)
        self.db.commit()
        self.db.refresh(db_category)
        return db_category

    def delete(self, db_category: Category) -> None:
        self.db.delete(db_category)
        self.db.commit()

    def list_all(self) -> List[Category]:
        stmt = select(Category).order_by(Category.name)
        return list(self.db.execute(stmt).scalars().all())
