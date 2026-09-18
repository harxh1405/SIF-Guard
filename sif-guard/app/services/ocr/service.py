from typing import Optional
from app.services.ocr.base import BaseOCRProvider
from app.services.ocr.schemas import OCRResultSchema
from app.services.ocr.providers.tesseract_provider import TesseractOCRProvider
from app.core.config import settings
from app.core.logging import logger


class OCRService:
    """
    High-level OCR Service maintaining separation of responsibilities.
    Accepts images and PDF files, manages quality gates, and outputs clean normalized text.
    """

    def __init__(self, provider: Optional[BaseOCRProvider] = None):
        self.provider = provider or TesseractOCRProvider()

    def extract(self, file_bytes: bytes, filename: str) -> OCRResultSchema:
        if not file_bytes:
            return OCRResultSchema(
                text="",
                confidence=0.0,
                source_type="unknown",
                pages=0,
                requires_verification=True,
                warnings=["Uploaded file is empty"],
                ocr_provider=settings.OCR_PROVIDER,
            )

        fn_lower = filename.lower()
        if fn_lower.endswith(".pdf"):
            return self.provider.extract_pdf(file_bytes, filename)
        elif fn_lower.endswith((".png", ".jpg", ".jpeg", ".webp", ".bmp", ".tiff")):
            return self.provider.extract_image(file_bytes, filename)
        else:
            return OCRResultSchema(
                text="",
                confidence=0.0,
                source_type="unsupported",
                pages=0,
                requires_verification=True,
                warnings=[f"Unsupported file format '{filename}'. Supported: PNG, JPG, JPEG, WEBP, PDF."],
                ocr_provider=settings.OCR_PROVIDER,
            )


ocr_service = OCRService()
