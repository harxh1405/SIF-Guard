from typing import Optional
from app.services.ocr.base import BaseOCRProvider
from app.services.ocr.schemas import OCRResultSchema
from app.services.ocr.providers.tesseract_provider import TesseractOCRProvider
from app.services.ocr.quality import image_quality_assessor
from app.services.ocr.tesseract import tesseract_strategy_engine
from app.core.config import settings
from app.core.logging import logger


class OCRService:
    """
    High-level OCR Service maintaining separation of responsibilities.
    Accepts images and PDF files, enforces image quality screening,
    evaluates multi-candidate Tesseract strategies, and outputs clean normalized text.
    """

    def __init__(self, provider: Optional[BaseOCRProvider] = None):
        self.provider = provider or TesseractOCRProvider()

    def extract(self, file_bytes: bytes, filename: str) -> OCRResultSchema:
        if not file_bytes or len(file_bytes) == 0:
            return OCRResultSchema(
                text="",
                confidence=0.0,
                source_type="unknown",
                pages=0,
                requires_verification=True,
                warnings=["Uploaded file is empty (0 bytes)"],
                ocr_provider=settings.OCR_PROVIDER,
                quality_status="poor",
                quality_reason="image_empty",
                quality_metrics={"byte_size": 0.0}
            )

        fn_lower = filename.lower()
        if fn_lower.endswith(".pdf"):
            return self.provider.extract_pdf(file_bytes, filename)
        elif fn_lower.endswith((".png", ".jpg", ".jpeg", ".webp", ".bmp", ".tiff")):
            source_type = "camera" if ("camera" in fn_lower or "cam_" in fn_lower) else "image"

            # 1. Image Quality Assessment Gate
            quality_res = image_quality_assessor.assess_image_quality(file_bytes)
            if not quality_res.is_acceptable or quality_res.quality_status == "poor":
                logger.warning(
                    f"OCR Quality Gate rejected image '{filename}': reason={quality_res.reason}, metrics={quality_res.metrics}"
                )
                return OCRResultSchema(
                    text="",
                    confidence=0.0,
                    source_type=source_type,
                    pages=1,
                    requires_verification=True,
                    warnings=[f"Image quality insufficient: {quality_res.reason}"],
                    ocr_provider=settings.OCR_PROVIDER,
                    quality_status="poor",
                    quality_reason=quality_res.reason,
                    quality_metrics=quality_res.metrics
                )

            # 2. Multi-Candidate Tesseract Strategy Execution
            return tesseract_strategy_engine.extract_from_image_bytes(
                image_bytes=file_bytes,
                filename=filename,
                source_type=source_type,
                quality_status=quality_res.quality_status,
                quality_reason=quality_res.reason,
                quality_metrics=quality_res.metrics
            )
        else:
            return OCRResultSchema(
                text="",
                confidence=0.0,
                source_type="unsupported",
                pages=0,
                requires_verification=True,
                warnings=[f"Unsupported file format '{filename}'. Supported: PNG, JPG, JPEG, WEBP, PDF."],
                ocr_provider=settings.OCR_PROVIDER,
                quality_status="poor",
                quality_reason="unsupported_format"
            )


ocr_service = OCRService()
