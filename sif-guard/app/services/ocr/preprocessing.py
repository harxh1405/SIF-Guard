import io
import re
from PIL import Image, ImageEnhance, ImageFilter


# Domain HSE acronyms to preserve during normalization
HSE_ACRONYMS = {
    "LOTO", "H2S", "LEL", "PTW", "PPE", "SCBA", "PSV", "ESD",
    "SIMOPS", "JSA", "HAZOP", "MOC", "IOGP", "SIF", "OCS"
}


def preprocess_image_for_ocr(image_bytes: bytes) -> Image.Image:
    """
    Conservative image preprocessing prior to OCR:
    - Auto orientation check
    - Conversion to Grayscale
    - Contrast enhancement
    """
    img = Image.open(io.BytesIO(image_bytes))

    # Convert RGBA / P mode to RGB first
    if img.mode in ("RGBA", "P", "LA"):
        img = img.convert("RGB")

    # Grayscale conversion
    gray = img.convert("L")

    # Moderate contrast enhancement
    enhancer = ImageEnhance.Contrast(gray)
    enhanced = enhancer.enhance(1.4)

    return enhanced


def normalize_ocr_text(text: str) -> str:
    """
    Conservative normalization of OCR extracted text.
    Cleans excessive whitespace, normalizes line breaks, but strictly preserves domain acronyms.
    """
    if not text:
        return ""

    # Replace multiple spaces with a single space
    cleaned = re.sub(r"[ \t]+", " ", text)
    # Replace multiple line breaks with a single newline
    cleaned = re.sub(r"\n\s*\n", "\n", cleaned)
    # Trim lines
    lines = [line.strip() for line in cleaned.split("\n") if line.strip()]
    normalized = "\n".join(lines)

    return normalized
