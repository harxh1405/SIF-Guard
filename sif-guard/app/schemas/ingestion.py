from typing import Optional, Dict, Any, Literal
from pydantic import BaseModel, Field


IngestionMethodType = Literal[
    "manual",
    "image",
    "pdf_native",
    "pdf_ocr",
    "camera",
    "json",
    "jsonl",
    "csv",
    "structured"
]


class NormalizedReport(BaseModel):
    """
    Standardized internal representation of any incoming safety report
    regardless of input channel (Manual narrative, Image, PDF, Camera, JSON, JSONL, CSV).
    Ensures the downstream NLP pipeline receives a uniform contract.
    """
    report_id: str
    report_type: Optional[str] = "observation"
    text: str
    source: str = "oil_hsse"
    ingestion_method: IngestionMethodType = "manual"
    ocr_used: bool = False
    ocr_confidence: Optional[float] = None
    site: Optional[str] = "Not specified"
    employer: Optional[str] = "Oil India Limited"
    activity: Optional[str] = None
    hazard: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)
