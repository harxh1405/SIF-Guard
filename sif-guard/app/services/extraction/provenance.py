from typing import Optional, Literal
from pydantic import BaseModel, Field


EntitySourceType = Literal["transformer", "rule", "transformer+rule", "heuristic"]


class EntityEvidence(BaseModel):
    """
    Internal provenance record for any extracted safety entity.
    Tracks exact text slice, category label, character offsets, confidence, and detection source.
    """
    text: str
    label: str
    start: int
    end: int
    confidence: float = 1.0
    source: EntitySourceType = "rule"
    metadata: Optional[dict] = Field(default_factory=dict)
