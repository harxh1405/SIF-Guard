import uuid
from typing import Dict, Any
from app.db.models.knowledge import CatastrophicMechanism


class CSBAdapter:
    """
    Optional future adapter for CSB (Chemical Safety Board) investigation summaries.
    Maps catastrophic investigation findings into catastrophic_mechanisms table.
    """

    def normalize(self, record: Dict[str, Any]) -> CatastrophicMechanism:
        rec_id = str(record.get("id", uuid.uuid4().hex))
        return CatastrophicMechanism(
            id=f"csb_{rec_id}",
            source="csb",
            title=str(record.get("title", "CSB Investigation")),
            activity=record.get("activity"),
            hazard=record.get("hazard"),
            exposure=record.get("exposure"),
            barrier=record.get("barrier"),
            barrier_failure=record.get("barrier_failure"),
            consequence=record.get("consequence")
        )
