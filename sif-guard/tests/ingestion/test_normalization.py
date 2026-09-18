import pytest
from app.schemas.ingestion import NormalizedReport
from app.services.ingestion.normalizer import report_normalizer
from app.db.models.report import SafetyReport


def test_normalization_across_all_channels():
    # 1. Manual Text
    m_rep = report_normalizer.from_text("Worker entered tank", report_id="R-MAN")
    assert m_rep.ingestion_method == "manual"
    assert m_rep.ocr_used is False
    assert m_rep.ocr_confidence is None

    # 2. Image OCR
    img_rep = report_normalizer.from_ocr("Scaffold missing toe-board", 0.91, source_type="image")
    assert img_rep.ingestion_method == "image"
    assert img_rep.ocr_used is True
    assert img_rep.ocr_confidence == 0.91

    # 3. PDF Native
    pdf_nat = report_normalizer.from_ocr("Pressure isolation completed", 0.99, source_type="pdf_native")
    assert pdf_nat.ingestion_method == "pdf_native"
    assert pdf_nat.ocr_used is False

    # 4. PDF Scanned OCR
    pdf_ocr = report_normalizer.from_ocr("Cracked crane hook noted", 0.85, source_type="pdf_ocr")
    assert pdf_ocr.ingestion_method == "pdf_ocr"
    assert pdf_ocr.ocr_used is True
    assert pdf_ocr.ocr_confidence == 0.85

    # 5. Camera Capture
    cam_rep = report_normalizer.from_ocr("Trench wall slumped", 0.89, source_type="camera", filename="camera_field_1.jpg")
    assert cam_rep.ingestion_method == "camera"
    assert cam_rep.ocr_used is True

    # 6. JSON / CSV Structured
    dict_rep = report_normalizer.from_dict({
        "report_id": "REC-CSV-1",
        "description": "LOTO applied on electrical switchgear",
        "site": "Substation 2"
    }, ingestion_method="csv")
    assert dict_rep.ingestion_method == "csv"
    assert dict_rep.ocr_used is False

    # Convert to DB model
    db_model = report_normalizer.to_db_model(dict_rep)
    assert isinstance(db_model, SafetyReport)
    assert "oil_REC-CSV-1" in db_model.id
    assert db_model.site == "Substation 2"
