"""OCR service layer.

The OCR engine is abstracted behind `OCRService` so that the underlying
implementation (currently PaddleOCR) can be swapped out in the future
without changing any route code.
"""
import re
import time
from abc import ABC, abstractmethod
from typing import Optional

import numpy as np
from PIL import Image


class BaseOCREngine(ABC):
    """Abstract interface every OCR engine implementation must satisfy."""

    @abstractmethod
    def read(self, image: np.ndarray) -> list:
        """Run OCR on an image array and return a list of (bbox, text, confidence)."""
        raise NotImplementedError


class PaddleOCREngine(BaseOCREngine):
    """PaddleOCR-backed engine. The model is loaded once and reused."""

    def __init__(self, languages: list[str], gpu: bool = False):
        from paddleocr import PaddleOCR  # imported lazily so app import time stays fast

        # PaddleOCR uses a single language code (e.g. "en"), unlike EasyOCR's
        # list of languages. We take the first configured language.
        lang = languages[0] if languages else "en"

        self._reader = PaddleOCR(
            use_angle_cls=True,
            lang=lang,
            use_gpu=gpu,
            show_log=False,
        )

    def read(self, image: np.ndarray) -> list:
        raw_results = self._reader.ocr(image, cls=True)

        results = []
        if not raw_results:
            return results

        # PaddleOCR returns a list of pages; each page is a list of
        # [bbox, (text, confidence)] entries.
        for page in raw_results:
            if not page:
                continue
            for entry in page:
                bbox, (text, confidence) = entry
                results.append((bbox, text, confidence))

        return results


class OCRService:
    """High level OCR service used by API routes.

    Holds a single, already-initialized OCR engine instance (set during
    application startup) and exposes a stable `extract_text` method.
    """

    def __init__(self, engine: Optional[BaseOCREngine] = None):
        self._engine = engine

    def set_engine(self, engine: BaseOCREngine) -> None:
        self._engine = engine

    @property
    def is_ready(self) -> bool:
        return self._engine is not None

    def extract_text(self, image: Image.Image) -> tuple[str, int, float]:
        """Run OCR on a PIL image.

        Returns a tuple of (clean_text, character_count, processing_time_seconds).
        """
        if self._engine is None:
            raise RuntimeError("OCR engine has not been initialized yet.")

        start = time.perf_counter()

        rgb_image = image.convert("RGB")
        image_array = np.array(rgb_image)

        results = self._engine.read(image_array)
        raw_lines = [text for (_bbox, text, _confidence) in results]

        clean_text = self._clean_text(raw_lines)
        elapsed = time.perf_counter() - start

        return clean_text, len(clean_text), round(elapsed, 4)

    @staticmethod
    def _clean_text(lines: list[str]) -> str:
        """Merge OCR lines into readable paragraphs and normalize whitespace."""
        # Normalize whitespace within each detected line.
        normalized = [re.sub(r"\s+", " ", line).strip() for line in lines]
        normalized = [line for line in normalized if line]

        if not normalized:
            return ""

        # Join lines with newlines to preserve paragraph-like readability,
        # while collapsing any accidental blank/duplicate whitespace.
        merged = "\n".join(normalized)
        merged = re.sub(r"[ \t]+\n", "\n", merged)
        merged = re.sub(r"\n{3,}", "\n\n", merged)
        return merged.strip()


# Singleton instance shared across the app. The actual engine is attached
# during FastAPI's startup event in main.py.
ocr_service = OCRService()
