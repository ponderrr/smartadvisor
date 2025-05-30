from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.core.config import settings
from app.core.database import engine, Base
from app.api.v1.api import api_router

import app.models


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Starting up...")
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        print("Database tables created/verified successfully")
    except Exception as e:
        print(f"Error with database setup: {e}")
        raise

    yield

    await engine.dispose()
    print("Application shutdown complete")


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.VERSION,
    openapi_url="/api/v1/openapi.json" if settings.DEBUG else None,
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api/v1")


@app.get("/")
async def root():
    return {"message": "Smart Advisor API", "version": settings.VERSION}


@app.get("/health")
async def health_check():
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn

    print(f"Starting {settings.APP_NAME} v{settings.VERSION}")
    print(f"Debug mode: {settings.DEBUG}")
    print(f"Database URL: {settings.database_url}")
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=settings.DEBUG)
