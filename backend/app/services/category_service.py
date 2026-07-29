from typing import List
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.repositories.category_repository import CategoryRepository
from app.schemas.category import CategoryCreate, CategoryUpdate, CategoryResponse


class CategoryService:
    """Business logic for Category management."""

    def __init__(self, db: Session):
        self.category_repo = CategoryRepository(db)

    def create_category(self, category_in: CategoryCreate) -> CategoryResponse:
        existing = self.category_repo.get_by_name(category_in.name)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Category with name '{category_in.name}' already exists."
            )
        category = self.category_repo.create(category_in)
        return CategoryResponse.model_validate(category)

    def update_category(self, category_id: int, category_in: CategoryUpdate) -> CategoryResponse:
        category = self.category_repo.get_by_id(category_id)
        if not category:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Category with ID {category_id} not found."
            )
        if category_in.name and category_in.name.lower() != category.name.lower():
            existing = self.category_repo.get_by_name(category_in.name)
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Category with name '{category_in.name}' already exists."
                )
        updated = self.category_repo.update(category, category_in)
        return CategoryResponse.model_validate(updated)

    def delete_category(self, category_id: int) -> None:
        category = self.category_repo.get_by_id(category_id)
        if not category:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Category with ID {category_id} not found."
            )
        self.category_repo.delete(category)

    def get_category(self, category_id: int) -> CategoryResponse:
        category = self.category_repo.get_by_id(category_id)
        if not category:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Category with ID {category_id} not found."
            )
        return CategoryResponse.model_validate(category)

    def list_categories(self) -> List[CategoryResponse]:
        categories = self.category_repo.list_all()
        return [CategoryResponse.model_validate(c) for c in categories]
