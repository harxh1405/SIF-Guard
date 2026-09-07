import uuid
from typing import List, Dict, Any, Tuple
import pandas as pd
from app.services.ingestion.base import DataSourceAdapter
from app.db.models.knowledge import HSEKnowledge


class SmartQHSEAdapter:
    """Adapter for importing HSE knowledge, Q&A, and process safety references into hse_knowledge."""

    def normalize_knowledge(self, record: Dict[str, Any]) -> HSEKnowledge:
        rec_id = str(record.get("id", uuid.uuid4().hex))
        return HSEKnowledge(
            id=f"smartqhse_{rec_id}",
            source="smartqhse",
            title=str(record.get("title", "HSE Knowledge Item")),
            content=str(record.get("content", "")),
            category=str(record.get("category")) if record.get("category") else "general",
            keywords=record.get("keywords", []),
            metadata_json=record.get("metadata", {})
        )
