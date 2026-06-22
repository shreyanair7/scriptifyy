"""Application configuration loaded from environment variables."""
import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent.parent


class Settings:
    PROJECT_NAME: str = "Scriptify API"
    API_PREFIX: str = "/api"

    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", f"sqlite:///{BASE_DIR / 'scriptify.db'}")

    # JWT
    SECRET_KEY: str = os.getenv("SECRET_KEY", "CHANGE_THIS_SECRET_KEY_IN_PRODUCTION")
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))

    # CORS
    CORS_ORIGINS: list[str] = os.getenv(
        "CORS_ORIGINS",
        "http://localhost:3000,http://localhost:5173,http://localhost:8080,http://127.0.0.1:5173",
    ).split(",")

    # Uploads
    UPLOAD_DIR: Path = BASE_DIR / "app" / "uploads"
    MAX_FILE_SIZE_MB: int = int(os.getenv("MAX_FILE_SIZE_MB", "10"))
    MAX_FILE_SIZE_BYTES: int = MAX_FILE_SIZE_MB * 1024 * 1024
    ALLOWED_EXTENSIONS: set[str] = {".png", ".jpg", ".jpeg", ".webp"}
    ALLOWED_CONTENT_TYPES: set[str] = {
        "image/png",
        "image/jpeg",
        "image/jpg",
        "image/webp",
    }

    # OCR
    OCR_LANGUAGES: list[str] = os.getenv("OCR_LANGUAGES", "en").split(",")
    OCR_GPU: bool = os.getenv("OCR_GPU", "false").lower() == "true"


settings = Settings()
settings.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
