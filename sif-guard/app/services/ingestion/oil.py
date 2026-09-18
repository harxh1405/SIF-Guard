import uuid
import datetime
from typing import List, Dict, Any, Tuple
import pandas as pd
from app.services.ingestion.base import DataSourceAdapter
from app.db.models.report import SafetyReport


class OILHSSEAdapter(DataSourceAdapter):
    """
    Adapter for Oil India Limited (OIL) confidential Unsafe Act (UA), Unsafe Condition (UC),
    Near Miss, and Incident datasets.
    """

    def validate(self, df: pd.DataFrame) -> Tuple[pd.DataFrame, int]:
        possible_text_cols = ["description", "narrative", "observation", "report_text"]
        found = any(col in df.columns for col in possible_text_cols)
        if not found:
            raise ValueError("Missing narrative column in OIL HSSE dataset")
        valid_df = df.dropna(subset=[col for col in possible_text_cols if col in df.columns][:1]).copy()
        return valid_df, len(df) - len(valid_df)

    def normalize(self, record: Dict[str, Any]) -> SafetyReport:
        rec_id = str(record.get("source_record_id", record.get("id", record.get("report_no", uuid.uuid4().hex))))
        text_col = next((k for k in ["description", "narrative", "observation", "report_text"] if k in record and pd.notna(record[k])), "")
        
        data_origin = record.get("data_origin")
        if not data_origin:
            if rec_id.startswith(("BFT-", "REC-BFT-", "bft-")) or "bft" in rec_id.lower() or record.get("site") == "Test Facility":
                data_origin = "synthetic"
            elif rec_id.startswith(("RAW-", "OCR-", "MANUAL-")):
                data_origin = "MANUAL_NARRATIVE"
            else:
                data_origin = "oil_hsse"

        return SafetyReport(
            id=f"oil_{rec_id}",
            source_dataset="oil_hsse",
            source_record_id=rec_id,
            data_origin=data_origin,
            report_type=str(record.get("type", record.get("category", "observation"))),
            report_text=str(record.get(text_col, "")).strip(),
            site=str(record.get("site", record.get("facility", record.get("installation", record.get("field", "Not specified"))))),
            employer="Oil India Limited",
            activity=str(record.get("activity")) if pd.notna(record.get("activity")) else None,
            hazard=str(record.get("hazard")) if pd.notna(record.get("hazard")) else None,
            raw_data=record
        )

    def ingest(self, df: pd.DataFrame) -> List[SafetyReport]:
        valid_df, _ = self.validate(df)
        reports = []
        for _, row in valid_df.iterrows():
            reports.append(self.normalize(row.to_dict()))
        return reports
