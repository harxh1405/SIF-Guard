import uuid
import datetime
from typing import List, Dict, Any, Tuple
import pandas as pd
from app.services.ingestion.base import DataSourceAdapter
from app.db.models.report import SafetyReport


class OSHASevereInjuryAdapter(DataSourceAdapter):

    def validate(self, df: pd.DataFrame) -> Tuple[pd.DataFrame, int]:
        required_cols = ["ID", "Final Narrative"]
        for col in required_cols:
            if col not in df.columns:
                raise ValueError(f"Missing required column '{col}' for OSHA Severe Injury dataset")
        
        valid_mask = df["Final Narrative"].notna() & (df["Final Narrative"].str.strip() != "")
        valid_df = df[valid_mask].copy()
        invalid_count = len(df) - len(valid_df)
        return valid_df, invalid_count

    def normalize(self, record: Dict[str, Any]) -> SafetyReport:
        rec_id = str(record.get("ID", uuid.uuid4().hex))
        
        # Parse date
        event_date = None
        raw_date = record.get("EventDate")
        if pd.notna(raw_date):
            try:
                event_date = pd.to_datetime(raw_date)
                if pd.isna(event_date):
                    event_date = None
            except Exception:
                event_date = None

        # Build location
        addr1 = str(record.get("Address1", "")) if pd.notna(record.get("Address1")) else ""
        addr2 = str(record.get("Address2", "")) if pd.notna(record.get("Address2")) else ""
        location = f"{addr1} {addr2}".strip() or None

        # Build hazard / equipment cues from SourceTitle & Secondary Source Title
        src_title = str(record.get("SourceTitle", "")) if pd.notna(record.get("SourceTitle")) else ""
        sec_src_title = str(record.get("Secondary Source Title", "")) if pd.notna(record.get("Secondary Source Title")) else ""
        hazard_clue = f"{src_title} {sec_src_title}".strip() or None

        # Store raw metrics as dictionary
        raw_metadata = {
            "hospitalized": record.get("Hospitalized"),
            "amputation": record.get("Amputation"),
            "loss_of_eye": record.get("Loss of Eye"),
            "inspection": record.get("Inspection"),
            "nature_code": record.get("Nature"),
            "event_code": record.get("Event"),
            "source_code": record.get("Source"),
            "secondary_source_code": record.get("Secondary Source"),
        }

        report = SafetyReport(
            id=f"osha_severe_{rec_id}",
            source_dataset="osha_severe",
            source_record_id=rec_id,
            report_type="incident",
            report_text=str(record.get("Final Narrative", "")).strip(),
            event_date=event_date,
            employer=str(record.get("Employer")) if pd.notna(record.get("Employer")) else None,
            site=str(record.get("Employer")) if pd.notna(record.get("Employer")) else None,
            location=location,
            city=str(record.get("City")) if pd.notna(record.get("City")) else None,
            state=str(record.get("State")) if pd.notna(record.get("State")) else None,
            latitude=float(record.get("Latitude")) if pd.notna(record.get("Latitude")) else None,
            longitude=float(record.get("Longitude")) if pd.notna(record.get("Longitude")) else None,
            naics=str(record.get("Primary NAICS")) if pd.notna(record.get("Primary NAICS")) else None,
            actual_severity=str(record.get("NatureTitle")) if pd.notna(record.get("NatureTitle")) else None,
            immediate_consequence=str(record.get("NatureTitle")) if pd.notna(record.get("NatureTitle")) else None,
            affected_body_part=str(record.get("Part of Body Title")) if pd.notna(record.get("Part of Body Title")) else None,
            event_type=str(record.get("EventTitle")) if pd.notna(record.get("EventTitle")) else None,
            hazard=hazard_clue,
            equipment=src_title or None,
            raw_data=raw_metadata
        )
        return report

    def ingest(self, df: pd.DataFrame) -> List[SafetyReport]:
        valid_df, _ = self.validate(df)
        reports = []
        for _, row in valid_df.iterrows():
            reports.append(self.normalize(row.to_dict()))
        return reports
