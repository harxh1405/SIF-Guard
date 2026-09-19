import io
import re
from typing import Dict, Tuple
import numpy as np
from PIL import Image, ImageEnhance, ImageFilter, ImageOps


# Domain HSE acronyms to preserve during normalization
HSE_ACRONYMS = {
    "LOTO", "H2S", "LEL", "PTW", "PPE", "SCBA", "PSV", "ESD",
    "SIMOPS", "JSA", "HAZOP", "MOC", "IOGP", "SIF", "OCS"
}


def auto_orient_image(img: Image.Image) -> Image.Image:
    """Corrects image orientation using EXIF tags (crucial for mobile/camera photos)."""
    try:
        return ImageOps.exif_transpose(img)
    except Exception:
        return img


def convert_to_clean_grayscale(img: Image.Image) -> Image.Image:
    """Converts image modes (RGBA, P, LA, CMYK) safely to clean Grayscale."""
    if img.mode in ("RGBA", "P", "LA"):
        img = img.convert("RGB")
    elif img.mode == "CMYK":
        img = img.convert("RGB")
    return img.convert("L")


def resize_for_optimal_ocr(gray_img: Image.Image, target_min_dim: int = 1400) -> Image.Image:
    """
    Intelligently rescales image so that standard document font height reaches 30-40 pixels,
    which is optimal for Tesseract text and token segmentation.
    """
    w, h = gray_img.size
    min_dim = min(w, h)
    max_dim = max(w, h)

    # Upscale if image is smaller than target resolution (e.g. 720p camera stream)
    if min_dim < target_min_dim:
        scale = min(2.5, target_min_dim / float(min_dim))
        new_w = int(round(w * scale))
        new_h = int(round(h * scale))
        return gray_img.resize((new_w, new_h), Image.Resampling.LANCZOS)

    # Downscale if image is excessively large to prevent memory / latency spikes
    if max_dim > 3200:
        scale = 3200.0 / float(max_dim)
        new_w = int(round(w * scale))
        new_h = int(round(h * scale))
        return gray_img.resize((new_w, new_h), Image.Resampling.LANCZOS)

    return gray_img


def enhance_document_contrast(gray_img: Image.Image, factor: float = 1.6) -> Image.Image:
    """Enhances grayscale contrast to separate ink from paper background."""
    enhancer = ImageEnhance.Contrast(gray_img)
    return enhancer.enhance(factor)


def denoise_document(gray_img: Image.Image) -> Image.Image:
    """Applies a 3x3 median filter to eliminate high-frequency camera sensor noise."""
    return gray_img.filter(ImageFilter.MedianFilter(size=3))


def otsu_binarize(gray_img: Image.Image) -> Image.Image:
    """
    Pure numpy implementation of Otsu global thresholding.
    Produces optimal monochrome binarization without shadow/lighting gradients.
    """
    arr = np.array(gray_img, dtype=np.uint8)
    hist, _ = np.histogram(arr, bins=256, range=(0, 256))
    total = arr.size
    current_max = 0.0
    threshold = 128
    sum_total = np.dot(np.arange(256), hist)
    sum_b, w_b = 0.0, 0

    for t in range(256):
        w_b += hist[t]
        if w_b == 0:
            continue
        w_f = total - w_b
        if w_f == 0:
            break
        sum_b += t * hist[t]
        m_b = sum_b / w_b
        m_f = (sum_total - sum_b) / w_f
        between_var = w_b * w_f * (m_b - m_f) ** 2
        if between_var > current_max:
            current_max = between_var
            threshold = t

    bin_arr = np.where(arr > threshold, 255, 0).astype(np.uint8)
    return Image.fromarray(bin_arr, mode="L")


def prepare_ocr_variants(image_bytes: bytes) -> Dict[str, Image.Image]:
    """
    Generates deterministic preprocessed variants for multi-candidate Tesseract evaluation.
    """
    img = Image.open(io.BytesIO(image_bytes))
    oriented = auto_orient_image(img)
    gray = convert_to_clean_grayscale(oriented)
    resized = resize_for_optimal_ocr(gray)

    # Variant 1: Enhanced Grayscale + Denoised
    enhanced = enhance_document_contrast(resized, 1.6)
    denoised = denoise_document(enhanced)

    # Variant 2: Otsu Binarized
    binarized = otsu_binarize(resized)

    # Variant 3: Clean Resized Grayscale (Conservative fallback)
    return {
        "gray_enhanced": denoised,
        "binarized": binarized,
        "gray_resized": resized
    }


def preprocess_image_for_ocr(image_bytes: bytes) -> Image.Image:
    """
    Backward-compatible entry point returning the primary preprocessed image variant.
    """
    variants = prepare_ocr_variants(image_bytes)
    return variants["gray_enhanced"]


def normalize_ocr_text(text: str) -> str:
    """
    Conservative normalization of OCR extracted text.
    Cleans excessive whitespace, normalizes line breaks, but strictly preserves domain acronyms.
    """
    if not text:
        return ""

    # Split fused acronyms + lowercase words (e.g. H2Swas -> H2S was, LOTOnot -> LOTO not)
    cleaned = re.sub(r"\b([A-Z0-9]{2,})([a-z]{2,})\b", r"\1 \2", text)

    # Separate common fused auxiliary verbs and prepositions from camera OCR
    for w in ["was", "is", "were", "had", "not", "near", "before", "after", "inside", "during"]:
        cleaned = re.sub(rf"\b({w})([a-z]{{3,}})\b", rf"\1 \2", cleaned, flags=re.IGNORECASE)

    # Replace multiple spaces with a single space
    cleaned = re.sub(r"[ \t]+", " ", cleaned)
    # Replace multiple line breaks with a single newline
    cleaned = re.sub(r"\n\s*\n", "\n", cleaned)
    # Trim lines
    lines = [line.strip() for line in cleaned.split("\n") if line.strip()]
    normalized = "\n".join(lines)

    return normalized
