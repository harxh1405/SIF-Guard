from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional
from app.services.ocr.schemas import OCRResultSchema


class BaseOCRProvider(ABC):
    """
    Provider-agnostic interface for OCR engines (Tesseract, PaddleOCR, AWS Textract, Azure Doc AI, etc.).
    """

    @abstractmethod
    def extract_image(self, image_bytes: bytes, filename: str) -> OCRResultSchema:
        """
        Extract text from an image byte stream.
        """
        pass

    @abstractmethod
    def extract_pdf(self, pdf_bytes: bytes, filename: str) -> OCRResultSchema:
        """
        Extract text from a PDF document byte stream.
        """
        pass
