import io
import pytest
from PIL import Image, ImageDraw
from fastapi.testclient import TestClient
from app.main import app
from app.services.ingestion.normalizer import report_normalizer

client = TestClient(app)


def test_camera_capture_payload_flow():
    # Simulate field camera snapshot
    img = Image.new("RGB", (600, 150), color=(255, 255, 255))
    d = ImageDraw.Draw(img)
    d.text((20, 50), "CAMERA EVIDENCE: MISSING TRENCH SHORING AT 2.5M DEPTH", fill=(0, 0, 0))
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    camera_bytes = buf.getvalue()

    filename = "camera_capture_20260919_030000.jpg"
    response = client.post(
        "/api/v1/ocr/extract",
        files={"file": (filename, camera_bytes, "image/jpeg")}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["confidence"] > 0.0

    norm = report_normalizer.from_ocr(
        extracted_text=data["text"],
        confidence=data["confidence"],
        source_type="camera",
        filename=filename
    )
    assert norm.ingestion_method == "camera"
    assert norm.ocr_used is True
    assert "SHORING" in norm.text or "TRENCH" in norm.text
