from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import require_teacher_or_admin, get_current_active_user
from app.models.user import User
from app.schemas.category import CategoryCreate, CategoryUpdate, CategoryResponse
from app.services.category_service import CategoryService

router = APIRouter()


@router.post(
    "",
    response_model=CategoryResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new quiz category (Teacher/Admin only)"
)
def create_category(
    category_in: CategoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher_or_admin)
):
    service = CategoryService(db)
    return service.create_category(category_in)


@router.get(
    "",
    response_model=List[CategoryResponse],
    summary="Get list of all quiz categories"
)
def list_categories(
    db: Session = Depends(get_db)
):
    service = CategoryService(db)
    return service.list_categories()


@router.get(
    "/{category_id}",
    response_model=CategoryResponse,
    summary="Get category details by ID"
)
def get_category(
    category_id: int,
    db: Session = Depends(get_db)
):
    service = CategoryService(db)
    return service.get_category(category_id)


@router.put(
    "/{category_id}",
    response_model=CategoryResponse,
    summary="Update category details (Teacher/Admin only)"
)
def update_category(
    category_id: int,
    category_in: CategoryUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher_or_admin)
):
    service = CategoryService(db)
    return service.update_category(category_id, category_in)


@router.delete(
    "/{category_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a category (Teacher/Admin only)"
)
def delete_category(
    category_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher_or_admin)
):
    service = CategoryService(db)
    service.delete_category(category_id)
