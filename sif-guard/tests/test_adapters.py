import pytest
import pandas as pd
from app.services.ingestion.osha_severe import OSHASevereInjuryAdapter
from app.services.ingestion.osha_construction import OSHAConstructionAdapter
from app.services.ingestion.oil import OILHSSEAdapter
from app.services.preprocessing.cleaner import TextCleaner


def test_osha_severe_adapter():
    data = {
        "ID": ["2015010015"],
        "EventDate": ["1/1/2015"],
        "Employer": ["Test Facility"],
        "City": ["NEW YORK"],
        "State": ["NEW YORK"],
        "Final Narrative": ["Employee received burns from torch."],
        "NatureTitle": ["Thermal burns"],
        "Part of Body Title": ["Legs"],
        "Hospitalized": [1.0],
        "Amputation": [0.0],
        "Loss of Eye": [0.0]
    }
    df = pd.DataFrame(data)
    adapter = OSHASevereInjuryAdapter()
    valid_df, invalid_count = adapter.validate(df)
    assert invalid_count == 0
    
    reports = adapter.ingest(df)
    assert len(reports) == 1
    assert reports[0].id == "osha_severe_2015010015"
    assert reports[0].report_text == "Employee received burns from torch."
    assert reports[0].employer == "Test Facility"


def test_osha_construction_adapter():
    data = {
        "summary_nr": ["220982664"],
        "Event Date": ["8/10/2017"],
        "Abstract Text": ["Employee amputated fingers operating power press."],
        "Event Description": ["Fingers caught in mechanical power press."],
        "Task Assigned": ["Power press operation"],
        "Environmental Factor": ["Catch Point"],
        "Human Factor": ["Regularly Assigned"],
        "Degree of Injury": ["Nonfatal"],
        "Nature of Injury": ["Amputation"],
        "Part of Body": ["Fingers"],
        "fat_cause": ["caught in machine"],
        "fall_ht": [0]
    }
    df = pd.DataFrame(data)
    adapter = OSHAConstructionAdapter()
    reports = adapter.ingest(df)
    
    assert len(reports) == 1
    assert reports[0].id == "osha_const_220982664"
    assert "power press" in reports[0].report_text.lower()
    assert reports[0].task_assigned == "Power press operation"
    assert reports[0].fatal_cause == "caught in machine"


def test_text_cleaner_terminology():
    cleaner = TextCleaner()
    text = "Worker performed hot work without LOTO and PTW near H2S zone."
    cleaned = cleaner.preprocess(text)
    
    assert "LOTO (Lockout Tagout)" in cleaned
    assert "PTW (Permit to Work)" in cleaned
    assert "H2S (Hydrogen Sulfide)" in cleaned
