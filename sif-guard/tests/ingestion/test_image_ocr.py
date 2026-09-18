import io
import pytest
from PIL import Image, ImageDraw
from fastapi.testclient import TestClient
from app.main import app
from app.services.ingestion.normalizer import report_normalizer

client = TestClient(app)


def _generate_test_image(text: str, fmt: str = "PNG") -> bytes:
    img = Image.new("RGB", (650, 150), color=(255, 255, 255))
    d = ImageDraw.Draw(img)
    d.text((25, 60), text, fill=(0, 0, 0))
    buf = io.BytesIO()
    img.save(buf, format=fmt)
    return buf.getvalue()


@pytest.mark.parametrize("ext,fmt,mime", [
    ("png", "PNG", "image/png"),
    ("jpg", "JPEG", "image/jpeg"),
    ("webp", "WEBP", "image/webp")
])
def test_image_ocr_formats(ext, fmt, mime):
    img_text = f"SAFETY REPORT: LOTO BYPASSED ON PUMP {ext.upper()}"
    img_bytes = _generate_test_image(img_text, fmt)

    response = client.post(
        "/api/v1/ocr/extract",
        files={"file": (f"site_photo.{ext}", img_bytes, mime)}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["source_type"] == "image"
    assert data["confidence"] > 0.0
    assert len(data["text"]) > 0

    norm = report_normalizer.from_ocr(
        extracted_text=data["text"],
        confidence=data["confidence"],
        source_type="image",
        filename=f"site_photo.{ext}"
    )
    assert norm.ocr_used is True
    assert norm.ingestion_method == "image"
    assert norm.ocr_confidence > 0.0
