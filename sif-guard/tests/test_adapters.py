import pytest
import pandas as pd
from app.services.ingestion.oil import OILHSSEAdapter
from app.services.preprocessing.cleaner import TextCleaner


def test_oil_hsse_adapter():
    data = {
        "report_id": ["OIL-TEST-001"],
        "date": ["2026-01-15"],
        "facility": ["Digboi Rig #4"],
        "activity": ["Pressure testing blow-out preventer"],
        "report_text": ["Worker observed uncalibrated pressure gauge during high-pressure test."],
        "hazard": ["High Pressure Line"],
        "barrier_failure": ["Gauge calibration expired"]
    }
    df = pd.DataFrame(data)
    adapter = OILHSSEAdapter()
    valid_df, invalid_count = adapter.validate(df)
    assert invalid_count == 0
    
    reports = adapter.ingest(df)
    assert len(reports) == 1
    assert reports[0].id.startswith("oil_")
    assert reports[0].report_text == "Worker observed uncalibrated pressure gauge during high-pressure test."
    assert reports[0].site == "Digboi Rig #4"


def test_text_cleaner_terminology():
    cleaner = TextCleaner()
    text = "Worker performed hot work without LOTO and PTW near H2S zone."
    cleaned = cleaner.preprocess(text)
    
    assert "LOTO (Lockout Tagout)" in cleaned
    assert "PTW (Permit to Work)" in cleaned
    assert "H2S (Hydrogen Sulfide)" in cleaned

