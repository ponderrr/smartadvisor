from fastapi import APIRouter
from app.api.v1.endpoints import (
    auth,
    users,
    preferences,
    recommendations,
    subscriptions,
)

api_router = APIRouter()

# Include all endpoint routers
api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(
    preferences.router, prefix="/preferences", tags=["preferences"]
)
api_router.include_router(
    recommendations.router, prefix="/recommendations", tags=["recommendations"]
)
api_router.include_router(
    subscriptions.router, prefix="/subscriptions", tags=["subscriptions"]
)
