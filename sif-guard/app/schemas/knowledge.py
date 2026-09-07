from typing import List, Optional, Dict, Any
from pydantic import BaseModel


class KnowledgeItemSchema(BaseModel):
    id: str
    source: str
    title: str
    content: str
    category: Optional[str] = None
    similarity_score: Optional[float] = None


class KnowledgeSearchResponse(BaseModel):
    query: str
    results: List[KnowledgeItemSchema]
