from fastapi import APIRouter
from app.api.v1.health import router as health_router
from app.api.v1.auth import router as auth_router
from app.api.v1.users import router as users_router
from app.api.v1.categories import router as categories_router
from app.api.v1.quizzes import router as quizzes_router
from app.api.v1.questions import router as questions_router

api_v1_router = APIRouter()

api_v1_router.include_router(health_router, tags=["Health"])
api_v1_router.include_router(auth_router, prefix="/auth", tags=["Authentication"])
api_v1_router.include_router(users_router, prefix="/users", tags=["Users"])
api_v1_router.include_router(categories_router, prefix="/categories", tags=["Categories"])
api_v1_router.include_router(quizzes_router, prefix="/quizzes", tags=["Quizzes"])
api_v1_router.include_router(questions_router, tags=["Questions"])
