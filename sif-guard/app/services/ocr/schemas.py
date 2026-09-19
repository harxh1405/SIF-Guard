from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


class OCRBoundingBox(BaseModel):
    x1: float
    y1: float
    x2: float
    y2: float


class OCRTokenResult(BaseModel):
    text: str
    confidence: float
    bbox: Optional[OCRBoundingBox] = None


class OCRPageResult(BaseModel):
    page_number: int
    text: str
    confidence: float
    tokens: List[OCRTokenResult] = Field(default_factory=list)


class OCRResultSchema(BaseModel):
    text: str
    confidence: float
    source_type: str  # 'image', 'pdf', 'camera'
    pages: int
    requires_verification: bool
    warnings: List[str] = Field(default_factory=list)
    page_results: List[OCRPageResult] = Field(default_factory=list)
    ocr_provider: str = "tesseract"
    method: str = "tesseract"
    quality_status: str = "good"  # 'good', 'warning', 'poor'
    quality_reason: Optional[str] = None
    quality_metrics: Optional[Dict[str, float]] = None
    source: Optional[str] = None
