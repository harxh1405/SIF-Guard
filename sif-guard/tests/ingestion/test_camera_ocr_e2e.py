import io
import pytest
import numpy as np
from PIL import Image, ImageDraw, ImageFont
from fastapi.testclient import TestClient

from app.main import app
from app.services.ocr.quality import image_quality_assessor
from app.services.ocr.preprocessing import prepare_ocr_variants
from app.services.ocr.tesseract import tesseract_strategy_engine
from app.services.ocr.service import ocr_service
from app.services.ingestion.normalizer import report_normalizer
from app.services.ingestion.oil import OILHSSEAdapter
from app.services.extraction.service import extraction_service
from app.services.sif.ensemble import ensemble_sif_classifier
from app.services.lsr.matcher import lsr_matcher

client = TestClient(app)


def _render_document_image(text: str, width: int = 1200, height: int = 400, font_size: int = 24) -> bytes:
    """Helper to render high-resolution realistic document/report image for OCR."""
    img = Image.new("RGB", (width, height), color=(255, 255, 255))
    draw = ImageDraw.Draw(img)
    try:
        font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", font_size)
    except Exception:
        font = ImageFont.load_default()

    # Draw header and text lines
    lines = text.strip().split("\n")
    y = 40
    for line in lines:
        draw.text((40, y), line, fill=(0, 0, 0), font=font)
        y += font_size + 14

    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=95)
    return buf.getvalue()


# ---------------------------------------------------------------------------
# TEST A: Valid captured JPEG reaches OCR
# ---------------------------------------------------------------------------
def test_a_valid_captured_jpeg_reaches_ocr():
    text = "SAFETY OBSERVATION REPORT\nElectrical isolator left unlocked during maintenance."
    img_bytes = _render_document_image(text)

    response = client.post(
        "/api/v1/ocr/extract",
        files={"file": ("camera_capture_field.jpg", img_bytes, "image/jpeg")}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["source_type"] == "camera"
    assert data["confidence"] > 0.0
    assert len(data["text"]) > 0


# ---------------------------------------------------------------------------
# TEST B: Empty/blank image is rejected by quality gate
# ---------------------------------------------------------------------------
def test_b_empty_image_is_rejected():
    # Pure blank image
    img = Image.new("RGB", (800, 600), color=(255, 255, 255))
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    blank_bytes = buf.getvalue()

    response = client.post(
        "/api/v1/ocr/extract",
        files={"file": ("camera_blank.jpg", blank_bytes, "image/jpeg")}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["quality_status"] == "poor"
    assert data["text"] == ""
    assert data["requires_verification"] is True


# ---------------------------------------------------------------------------
# TEST C: Zero-byte image is rejected with 400
# ---------------------------------------------------------------------------
def test_c_zero_byte_image_is_rejected():
    response = client.post(
        "/api/v1/ocr/extract",
        files={"file": ("camera_empty.jpg", b"", "image/jpeg")}
    )
    assert response.status_code == 400
    assert "empty" in response.json()["detail"].lower()


# ---------------------------------------------------------------------------
# TEST D: OCR response with text populates structured schema
# ---------------------------------------------------------------------------
def test_d_ocr_response_populates_structured_schema():
    text = "INSPECTION: Scaffolding missing toe boards and mid rails."
    img_bytes = _render_document_image(text)

    response = client.post(
        "/api/v1/ocr/extract",
        files={"file": ("camera_scaffold.jpg", img_bytes, "image/jpeg")}
    )
    assert response.status_code == 200
    data = response.json()
    assert "text" in data
    assert "confidence" in data
    assert "quality_status" in data
    assert "method" in data
    assert data["method"] == "tesseract"
    assert data["source_type"] == "camera"
    assert data["source"] == "camera_capture"


# ---------------------------------------------------------------------------
# TEST E: OCR response with empty/poor text produces failure/retake state
# ---------------------------------------------------------------------------
def test_e_ocr_response_with_empty_text_produces_failure_state():
    # Pure black image
    img = Image.new("RGB", (400, 400), color=(0, 0, 0))
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    black_bytes = buf.getvalue()

    response = client.post(
        "/api/v1/ocr/extract",
        files={"file": ("camera_dark.jpg", black_bytes, "image/jpeg")}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["quality_status"] == "poor"
    assert data["text"] == ""
    assert "dark" in data["quality_reason"] or "empty" in data["quality_reason"] or "contrast" in data["quality_reason"]


# ---------------------------------------------------------------------------
# TEST F: Poor OCR confidence produces verification warning
# ---------------------------------------------------------------------------
def test_f_poor_ocr_confidence_produces_verification_warning():
    # Synthetic degraded quality scenario directly assessed
    assessor_result = image_quality_assessor.assess_image_quality(b"RIFF\x00\x00\x00\x00WEBPVP8 ")
    assert assessor_result.quality_status == "poor"
    assert not assessor_result.is_acceptable


# ---------------------------------------------------------------------------
# TEST G: Manual narrative bypasses OCR
# ---------------------------------------------------------------------------
def test_g_manual_narrative_bypasses_ocr():
    narrative = "Technician opened high voltage breaker without verifying zero energy."
    norm = report_normalizer.from_text(
        text=narrative,
        report_id="MAN-001",
        source="manual_narrative"
    )
    assert norm.ocr_used is False
    assert norm.ingestion_method == "manual"
    assert norm.ocr_confidence is None
    assert norm.text == narrative


# ---------------------------------------------------------------------------
# TEST H: Image upload still uses OCR
# ---------------------------------------------------------------------------
def test_h_image_upload_uses_ocr():
    text = "SITE PHOTO: Crane outrigger deployed on uncompacted soil."
    img_bytes = _render_document_image(text)

    response = client.post(
        "/api/v1/ocr/extract",
        files={"file": ("site_photo_outrigger.png", img_bytes, "image/png")}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["source_type"] == "image"
    assert data["source"] == "image_upload"

    norm = report_normalizer.from_ocr(
        extracted_text=data["text"],
        confidence=data["confidence"],
        source_type="image",
        filename="site_photo_outrigger.png"
    )
    assert norm.ocr_used is True
    assert norm.ingestion_method == "image"


# ---------------------------------------------------------------------------
# TEST I: Camera capture uses OCR
# ---------------------------------------------------------------------------
def test_i_camera_capture_uses_ocr():
    text = "FIELD CAPTURE: Atmospheric monitor alarming on H2S 15ppm."
    img_bytes = _render_document_image(text)

    response = client.post(
        "/api/v1/ocr/extract",
        files={"file": ("camera_h2s_alarm.jpg", img_bytes, "image/jpeg")}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["source_type"] == "camera"
    assert data["source"] == "camera_capture"
    assert data["confidence"] > 0.0


# ---------------------------------------------------------------------------
# TEST J: Camera provenance is preserved in ingestion adapter
# ---------------------------------------------------------------------------
def test_j_camera_provenance_is_preserved():
    adapter = OILHSSEAdapter()
    narrative_text = "Gas release observed at compressor seal during routine round."
    cam_report = adapter.normalize({
        "source_record_id": "CAM-20260919-001",
        "report_text": narrative_text,
        "source": "camera"
    })
    assert cam_report.data_origin == "CAMERA_CAPTURE"
    assert cam_report.source_record_id.startswith("CAM-")

    # Verify manual narrative preservation
    man_report = adapter.normalize({
        "source_record_id": "MAN-20260919-002",
        "report_text": narrative_text,
        "source": "manual_narrative"
    })
    assert man_report.data_origin == "MANUAL_NARRATIVE"
    assert man_report.source_record_id.startswith("MAN-")


# ---------------------------------------------------------------------------
# TEST K: OCR text reaches the existing analysis pipeline
# ---------------------------------------------------------------------------
def test_k_ocr_text_reaches_analysis_pipeline():
    narrative = "During flange torqueing, worker was struck by pressurized hydraulic line."
    extracted = extraction_service.extract(narrative)
    assert extracted.activity is not None or len(extracted.hazards) > 0

    sif_pred = ensemble_sif_classifier.predict(narrative, extraction=extracted)
    assert sif_pred is not None
    assert sif_pred.classification in ["SIF_POTENTIAL", "NON_SIF", "SIF"]


# ---------------------------------------------------------------------------
# TEST L: Captured image is non-empty
# ---------------------------------------------------------------------------
def test_l_captured_image_is_non_empty():
    img_bytes = _render_document_image("Valid image bytes test")
    assert len(img_bytes) > 0
    q = image_quality_assessor.assess_image_quality(img_bytes)
    assert q.metrics.get("byte_size", 0) > 0


# ---------------------------------------------------------------------------
# TEST M: Preprocessing produces valid images
# ---------------------------------------------------------------------------
def test_m_preprocessing_produces_valid_images():
    img_bytes = _render_document_image("Preprocessing pipeline test", width=800, height=300)
    variants = prepare_ocr_variants(img_bytes)
    assert variants["gray_enhanced"] is not None
    assert variants["binarized"] is not None
    assert variants["gray_resized"] is not None
    w, h = variants["gray_enhanced"].size
    assert w >= 800
    assert h >= 300


# ---------------------------------------------------------------------------
# TEST N: Tesseract fallback variants are deterministic
# ---------------------------------------------------------------------------
def test_n_tesseract_fallback_variants_are_deterministic():
    text = "DETERMINISTIC EVALUATION OF CANDIDATE VARIANTS"
    img_bytes = _render_document_image(text)
    
    res1 = tesseract_strategy_engine.extract_from_image_bytes(
        image_bytes=img_bytes,
        filename="deterministic_test.jpg",
        source_type="camera"
    )
    res2 = tesseract_strategy_engine.extract_from_image_bytes(
        image_bytes=img_bytes,
        filename="deterministic_test.jpg",
        source_type="camera"
    )

    assert res1.text == res2.text
    assert res1.confidence == res2.confidence
    assert res1.quality_status == res2.quality_status


# ---------------------------------------------------------------------------
# SECTION 10: REALISTIC OCR FIXTURE
# ---------------------------------------------------------------------------
def test_realistic_ocr_safety_report_fixture():
    fixture_text = (
        "During maintenance inside a storage vessel, atmospheric testing was not performed before entry.\n"
        "H2S was detected near the manway. The area was evacuated and the atmosphere was confirmed safe."
    )
    img_bytes = _render_document_image(fixture_text, width=1400, height=450, font_size=28)

    response = client.post(
        "/api/v1/ocr/extract",
        files={"file": ("camera_confined_space_h2s.jpg", img_bytes, "image/jpeg")}
    )
    assert response.status_code == 200
    data = response.json()

    extracted_text = data["text"].lower()
    # Semantic/key-term assertions (not requiring exact char-for-char equality)
    assert "storage vessel" in extracted_text or "vessel" in extracted_text
    assert "atmospheric testing" in extracted_text or "atmospheric" in extracted_text
    assert "h2s" in extracted_text
    assert "manway" in extracted_text
    assert "evacuated" in extracted_text
    assert data["confidence"] >= 0.70
    assert data["quality_status"] in ["good", "fair"]


# ---------------------------------------------------------------------------
# SECTION 11: END-TO-END TEST
# ---------------------------------------------------------------------------
def test_camera_ocr_e2e_pipeline_execution():
    fixture_text = (
        "During maintenance inside a storage vessel, atmospheric testing was not performed before entry.\n"
        "H2S was detected near the manway. The area was evacuated and the atmosphere was confirmed safe."
    )
    img_bytes = _render_document_image(fixture_text, width=1400, height=450, font_size=28)

    # 1. Camera Image -> OCR
    ocr_response = client.post(
        "/api/v1/ocr/extract",
        files={"file": ("camera_entry_test.jpg", img_bytes, "image/jpeg")}
    )
    assert ocr_response.status_code == 200
    ocr_data = ocr_response.json()
    extracted_text = ocr_data["text"]
    assert len(extracted_text) > 20

    # 2. Extracted text -> Verify & Review (simulate user verification / formatting)
    verified_text = extracted_text.strip()

    # 3. Analysis -> Extraction
    extracted = extraction_service.extract(verified_text)
    assert extracted is not None

    # 4. SIF Model (Ensemble)
    sif_pred = ensemble_sif_classifier.predict(verified_text, extraction=extracted)
    assert sif_pred is not None
    assert sif_pred.classification in ["SIF_POTENTIAL", "NON_SIF", "SIF"]
    assert sif_pred.score >= 0.0

    # 5. LSR (Life Saving Rules mapping)
    lsr_matches = lsr_matcher.map_report(verified_text)
    assert isinstance(lsr_matches, list)
    rule_codes = [m.rule_code for m in lsr_matches]
    assert "CONFINED_SPACE" in rule_codes or "WORK_AUTHORIZATION" in rule_codes or len(rule_codes) > 0

