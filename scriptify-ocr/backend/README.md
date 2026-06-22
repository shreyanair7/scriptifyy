# Scriptify Backend

Production-ready FastAPI backend for **Scriptify** — an OCR web application powered by PaddleOCR.

## Features

- JWT authentication (register / login / `me`)
- Guest mode for OCR without saving history
- PaddleOCR text extraction (model loaded once at startup)
- Extraction history (list / detail / delete) for authenticated users
- Profile management (view, update, change password)
- SQLite (SQLAlchemy ORM) for development
- Bcrypt password hashing via Passlib
- CORS enabled for frontend integration
- Swagger UI / OpenAPI docs

## Tech Stack

FastAPI · Python 3.11+ · PaddleOCR · SQLAlchemy · SQLite · JWT (python-jose) · Passlib (bcrypt) · Pydantic · Pillow · python-multipart

## Project Structure

```
backend/
└── app/
    ├── main.py                 # App entrypoint, lifespan, CORS, exception handlers
    ├── core/
    │   ├── config.py           # Settings from environment variables
    │   ├── security.py         # Password hashing & JWT utilities
    │   └── auth.py              # Auth dependencies (required / optional)
    ├── database/
    │   ├── db.py                # SQLAlchemy engine & Base
    │   ├── models.py            # User, OCRExtraction models
    │   └── session.py           # DB session dependency
    ├── schemas/
    │   ├── auth.py
    │   ├── user.py
    │   ├── profile.py
    │   └── ocr.py
    ├── routes/
    │   ├── auth.py
    │   ├── ocr.py
    │   ├── history.py
    │   └── profile.py
    ├── services/
    │   ├── paddleocr_service.py   # OCRService — swappable OCR engine
    │   └── history_service.py
    └── uploads/                 # (unused on disk; OCR runs in-memory)
```

## Setup

### 1. Create a virtual environment (recommended)

```bash
python3.11 -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
```

### 2. Install dependencies

```bash
pip install -r requirements.txt
```

> First run of PaddleOCR will download its detection/recognition/classification models (a few hundred MB) into `~/.paddleocr`. This requires an internet connection the first time.

### 3. Configure environment

```bash
cp .env.example .env
```

Edit `.env` and set a strong `SECRET_KEY` for production.

### 4. Run the server

```bash
uvicorn app.main:app --reload
```

The API will be available at `http://localhost:8000`.

- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`
- Health check: `http://localhost:8000/health`

Database tables are created automatically on startup (SQLite file `scriptify.db` in the `backend/` directory).

## API Overview

| Method | Endpoint                  | Auth        | Description                          |
|--------|---------------------------|-------------|--------------------------------------|
| POST   | `/api/auth/register`      | Public      | Create a new account                 |
| POST   | `/api/auth/login`         | Public      | Log in, receive JWT                  |
| GET    | `/api/auth/me`             | Required    | Current user details                 |
| POST   | `/api/ocr/extract`        | Optional*   | Upload image, extract text via OCR   |
| GET    | `/api/history`            | Required    | List all extractions                 |
| GET    | `/api/history/{id}`       | Required    | Extraction detail                    |
| DELETE | `/api/history/{id}`       | Required    | Delete an extraction                 |
| GET    | `/api/profile`            | Required    | Get profile                          |
| PUT    | `/api/profile`            | Required    | Update name / email                  |
| PUT    | `/api/profile/password`   | Required    | Change password                      |

\* `/api/ocr/extract` works with or without a JWT. If a valid token is supplied, the extraction is saved to history. If not (guest mode), OCR still runs but nothing is persisted.

### Authentication

Send the JWT as a Bearer token:

```
Authorization: Bearer <access_token>
```

### Password Requirements

At least 8 characters, including one uppercase letter, one lowercase letter, one digit, and one special character.

### OCR Upload Constraints

- Allowed formats: `png`, `jpg`, `jpeg`, `webp`
- Maximum file size: 10 MB (configurable via `MAX_FILE_SIZE_MB`)

## Notes on the OCR Engine

`PaddleOCREngine` is initialized exactly once during application startup (see `lifespan` in `main.py`) and reused for every request — the model is **never** reloaded per-request.

The engine is abstracted behind `BaseOCREngine` / `OCRService` in `app/services/paddleocr_service.py`, so a different OCR engine could be swapped in later without changing any route code — only `PaddleOCREngine` would need a sibling implementation, and `lifespan()` would attach it instead.

## Production Considerations

- Replace `SECRET_KEY` with a securely generated random value and keep it out of version control.
- Swap SQLite for PostgreSQL/MySQL by changing `DATABASE_URL` (SQLAlchemy handles the rest).
- Put PaddleOCR behind a process with enough memory/CPU (or GPU, via `OCR_GPU=true`) — it is a sizeable model.
- Consider a reverse proxy (Nginx) and process manager (e.g. Gunicorn with `uvicorn.workers.UvicornWorker`) for deployment.
