"""Scriptify backend application entrypoint."""
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.database.db import Base, engine
from app.routes import auth, history, ocr, profile
from app.services.paddleocr_service import PaddleOCREngine, ocr_service

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("scriptify")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create database tables.
    Base.metadata.create_all(bind=engine)

    # Initialize the PaddleOCR model ONCE at startup. This avoids the very
    # high cost of reloading the model on every request.
    logger.info("Loading PaddleOCR model (languages=%s, gpu=%s)...", settings.OCR_LANGUAGES, settings.OCR_GPU)
    engine_instance = PaddleOCREngine(languages=settings.OCR_LANGUAGES, gpu=settings.OCR_GPU)
    ocr_service.set_engine(engine_instance)
    logger.info("PaddleOCR model loaded successfully.")

    yield

    logger.info("Shutting down Scriptify API.")


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Backend API for Scriptify app, an OCR web application powered by PaddleOCR.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": exc.errors(), "message": "Validation error"},
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled exception while processing request: %s", request.url)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Internal server error.", "message": str(exc)},
    )


app.include_router(auth.router, prefix=settings.API_PREFIX)
app.include_router(ocr.router, prefix=settings.API_PREFIX)
app.include_router(history.router, prefix=settings.API_PREFIX)
app.include_router(profile.router, prefix=settings.API_PREFIX)


@app.get("/", tags=["Health"])
def root():
    return {"message": "Scriptify API is running", "docs": "/docs"}


@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "ok", "ocr_ready": ocr_service.is_ready}
