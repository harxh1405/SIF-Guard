import uuid
import datetime
from typing import List, Dict, Any, Tuple
import pandas as pd
from app.services.ingestion.base import DataSourceAdapter
from app.db.models.report import SafetyReport


class OSHAConstructionAdapter(DataSourceAdapter):

    def validate(self, df: pd.DataFrame) -> Tuple[pd.DataFrame, int]:
        # Check candidate narrative columns: Abstract Text, Event Description, or summary_nr
        possible_text_cols = ["Abstract Text", "Event Description"]
        found_text_col = any(col in df.columns for col in possible_text_cols)
        if not found_text_col:
            raise ValueError("Missing narrative column ('Abstract Text' or 'Event Description') for OSHA Construction dataset")
        
        # Valid if either narrative column has text
        text_series = df.get("Abstract Text", pd.Series([""] * len(df))).fillna("") + " " + df.get("Event Description", pd.Series([""] * len(df))).fillna("")
        valid_mask = text_series.str.strip() != ""
        valid_df = df[valid_mask].copy()
        invalid_count = len(df) - len(valid_df)
        return valid_df, invalid_count

    def normalize(self, record: Dict[str, Any]) -> SafetyReport:
        rec_id = str(record.get("summary_nr", uuid.uuid4().hex))
        
        # Build composite text from Abstract Text & Event Description
        abstract = str(record.get("Abstract Text", "")) if pd.notna(record.get("Abstract Text")) else ""
        desc = str(record.get("Event Description", "")) if pd.notna(record.get("Event Description")) else ""
        
        text_content = desc.strip() or abstract.strip()
        summary_content = abstract.strip() if desc.strip() else None

        # Parse date
        event_date = None
        raw_date = record.get("Event Date")
        if pd.notna(raw_date):
            try:
                event_date = pd.to_datetime(raw_date)
                if pd.isna(event_date):
                    event_date = None
            except Exception:
                event_date = None

        # Fall height parse
        fall_height = None
        raw_fall = record.get("fall_ht")
        if pd.notna(raw_fall):
            try:
                fall_height = float(raw_fall)
            except ValueError:
                fall_height = None

        # Building stories parse
        building_stories = None
        raw_stories = record.get("build_stor")
        if pd.notna(raw_stories):
            try:
                building_stories = int(float(raw_stories))
            except ValueError:
                building_stories = None

        report = SafetyReport(
            id=f"osha_const_{rec_id}",
            source_dataset="osha_construction",
            source_record_id=rec_id,
            report_type="incident",
            report_text=text_content,
            report_summary=summary_content,
            keywords=str(record.get("Event Keywords")) if pd.notna(record.get("Event Keywords")) else None,
            event_date=event_date,
            task_assigned=str(record.get("Task Assigned")) if pd.notna(record.get("Task Assigned")) else None,
            activity=str(record.get("Task Assigned")) if pd.notna(record.get("Task Assigned")) else None,
            event_type=str(record.get("Event type")) if pd.notna(record.get("Event type")) else None,
            environmental_factor=str(record.get("Environmental Factor")) if pd.notna(record.get("Environmental Factor")) else None,
            human_factor=str(record.get("Human Factor")) if pd.notna(record.get("Human Factor")) else None,
            hazardous_substance=str(record.get("hazsub")) if pd.notna(record.get("hazsub")) else None,
            fatal_cause=str(record.get("fat_cause")) if pd.notna(record.get("fat_cause")) else None,
            fall_height=fall_height,
            actual_severity=str(record.get("Degree of Injury")) if pd.notna(record.get("Degree of Injury")) else None,
            immediate_consequence=str(record.get("Nature of Injury")) if pd.notna(record.get("Nature of Injury")) else None,
            affected_body_part=str(record.get("Part of Body")) if pd.notna(record.get("Part of Body")) else None,
            construction_end_use=str(record.get("Construction End Use")) if pd.notna(record.get("Construction End Use")) else None,
            building_stories=building_stories,
            project_cost=str(record.get("Project Cost")) if pd.notna(record.get("Project Cost")) else None,
            project_type=str(record.get("Project Type")) if pd.notna(record.get("Project Type")) else None,
            raw_data=record
        )
        return report

    def ingest(self, df: pd.DataFrame) -> List[SafetyReport]:
        valid_df, _ = self.validate(df)
        reports = []
        for _, row in valid_df.iterrows():
            reports.append(self.normalize(row.to_dict()))
        return reports
