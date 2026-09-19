import io
import os
import re
import shutil
from dataclasses import dataclass, field
from typing import List, Dict, Any, Optional, Tuple
import pytesseract
from PIL import Image

# Ensure pytesseract locates the tesseract binary across macOS (Homebrew), Linux, and standard PATH locations
tesseract_bin = shutil.which("tesseract") or next(
    (p for p in ["/opt/homebrew/bin/tesseract", "/usr/local/bin/tesseract", "/usr/bin/tesseract"] if os.path.exists(p)),
    None
)
if tesseract_bin:
    pytesseract.pytesseract.tesseract_cmd = tesseract_bin
    bin_dir = os.path.dirname(tesseract_bin)
    if bin_dir not in os.environ.get("PATH", ""):
        os.environ["PATH"] = f"{bin_dir}:{os.environ.get('PATH', '')}"

from app.services.ocr.schemas import OCRResultSchema, OCRPageResult, OCRTokenResult, OCRBoundingBox
from app.services.ocr.preprocessing import prepare_ocr_variants, normalize_ocr_text
from app.core.config import settings
from app.core.logging import logger

HSE_KEYWORDS = {
    "safety", "vessel", "h2s", "testing", "permit", "barrier",
    "maintenance", "incident", "report", "entry", "atmosphere",
    "loto", "confined", "space", "line", "fire", "excavation",
    "hazard", "risk", "energy", "isolation", "digboi", "refinery"
}


@dataclass
class OCRCandidateResult:
    variant_name: str
    psm: int
    raw_text: str
    normalized_text: str
    confidence: float
    score: float
    tokens: List[OCRTokenResult] = field(default_factory=list)


def score_ocr_candidate(text: str, avg_conf: float) -> float:
    """
    Computes a deterministic OCR-quality score.
    Combines token confidence, alphanumeric character ratio, readable word proportion,
    and domain keyword matches. Does not choose purely on character length.
    """
    if not text or not text.strip():
        return 0.0

    words = text.split()
    if not words:
        return 0.0

    # 1. Base confidence (0.0 to 1.0)
    conf_score = max(0.0, min(1.0, avg_conf / 100.0 if avg_conf > 1.0 else avg_conf))

    # 2. Alphanumeric ratio (penalizes noise/garbage glyphs)
    clean_chars = sum(1 for c in text if c.isalnum() or c in " .,-/:()\n")
    alnum_ratio = clean_chars / max(len(text), 1)

    # 3. Readable word ratio (words with length >= 2 containing vowels)
    vowels = set("aeiouAEIOU")
    readable_words = [w for w in words if len(w) >= 2 and any(ch in vowels for ch in w)]
    readability = len(readable_words) / len(words)

    # 4. Word count factor (reaches 1.0 at 25 readable words)
    word_factor = min(1.0, len(readable_words) / 25.0)

    # 5. Domain HSE keyword hits
    kw_hits = sum(1 for w in words if re.sub(r"[^a-zA-Z0-9]", "", w).lower() in HSE_KEYWORDS)
    kw_bonus = min(0.25, kw_hits * 0.05)

    composite_score = (
        (conf_score * 0.35) +
        (readability * 0.25) +
        (alnum_ratio * 0.25) +
        (word_factor * 0.15) +
        kw_bonus
    )
    return round(composite_score, 4)


class TesseractStrategyEngine:
    """
    Executes a deterministic multi-candidate Tesseract OCR strategy,
    evaluating preprocessing variants and PSM configurations to select
    the highest-quality semantic transcription.
    """

    CANDIDATE_CONFIGS: List[Tuple[str, int]] = [
        ("gray_enhanced", 6),   # Candidate 1: Enhanced Grayscale + PSM 6 (single uniform block)
        ("binarized", 6),       # Candidate 2: Otsu Binarized + PSM 6
        ("gray_enhanced", 3),   # Candidate 3: Enhanced Grayscale + PSM 3 (auto page segmentation)
        ("binarized", 3),       # Candidate 4: Otsu Binarized + PSM 3
        ("gray_resized", 11),   # Candidate 5: Conservative Grayscale + PSM 11 (sparse text fallback)
    ]

    def extract_from_image_bytes(
        self,
        image_bytes: bytes,
        filename: str = "camera_capture.jpg",
        source_type: str = "camera",
        quality_status: str = "good",
        quality_reason: Optional[str] = None,
        quality_metrics: Optional[Dict[str, float]] = None
    ) -> OCRResultSchema:
        variants = prepare_ocr_variants(image_bytes)
        candidates: List[OCRCandidateResult] = []

        for variant_key, psm in self.CANDIDATE_CONFIGS:
            img = variants.get(variant_key)
            if img is None:
                continue

            try:
                data = pytesseract.image_to_data(
                    img,
                    config=f"--psm {psm}",
                    output_type=pytesseract.Output.DICT
                )
                raw_text = pytesseract.image_to_string(img, config=f"--psm {psm}")
                norm_text = normalize_ocr_text(raw_text)

                confidences = []
                tokens = []
                raw_text_items = data.get("text", [])
                raw_conf_items = data.get("conf", [])

                for i in range(len(raw_text_items)):
                    word = str(raw_text_items[i]).strip() if raw_text_items[i] else ""
                    raw_c = raw_conf_items[i] if i < len(raw_conf_items) else -1
                    try:
                        c_float = float(raw_c)
                    except (ValueError, TypeError):
                        c_float = -1.0

                    if word:
                        if c_float > 0:
                            confidences.append(c_float)
                            conf_score = round(c_float / 100.0, 2)
                        else:
                            conf_score = 0.0

                        tokens.append(
                            OCRTokenResult(
                                text=word,
                                confidence=conf_score,
                                bbox=OCRBoundingBox(
                                    x1=float(data["left"][i]),
                                    y1=float(data["top"][i]),
                                    x2=float(data["left"][i] + data["width"][i]),
                                    y2=float(data["top"][i] + data["height"][i]),
                                ),
                            )
                        )

                avg_conf = (sum(confidences) / len(confidences) / 100.0) if confidences else (0.85 if norm_text else 0.0)
                score = score_ocr_candidate(norm_text, avg_conf)

                candidates.append(
                    OCRCandidateResult(
                        variant_name=variant_key,
                        psm=psm,
                        raw_text=raw_text,
                        normalized_text=norm_text,
                        confidence=round(avg_conf, 4),
                        score=score,
                        tokens=tokens
                    )
                )
            except Exception as e:
                logger.warning(f"Tesseract OCR candidate ({variant_key}, PSM {psm}) execution failed: {e}")

        source_val = "camera_capture" if source_type == "camera" else "image_upload"
        if not candidates:
            return OCRResultSchema(
                text="",
                confidence=0.0,
                source_type=source_type,
                source=source_val,
                method="tesseract",
                pages=1,
                requires_verification=True,
                warnings=["OCR engine produced no valid candidates"],
                page_results=[],
                ocr_provider="tesseract",
                quality_status=quality_status,
                quality_reason=quality_reason,
                quality_metrics=quality_metrics
            )

        # Select the candidate with the highest deterministic quality score
        best_candidate = max(candidates, key=lambda c: (c.score, c.confidence, len(c.normalized_text)))

        # Determine if verification is required based on confidence & text length
        requires_verification = (
            best_candidate.confidence < settings.OCR_VERIFICATION_THRESHOLD or
            len(best_candidate.normalized_text.split()) < 3 or
            quality_status != "good"
        )

        warnings = []
        if quality_reason:
            warnings.append(f"Image quality alert: {quality_reason}")
        if best_candidate.confidence < settings.OCR_VERIFICATION_THRESHOLD:
            warnings.append("Low OCR confidence - user verification recommended")
        if not best_candidate.normalized_text:
            warnings.append("No readable text could be recognized from the image")

        page_res = OCRPageResult(
            page_number=1,
            text=best_candidate.normalized_text,
            confidence=best_candidate.confidence,
            tokens=best_candidate.tokens
        )

        return OCRResultSchema(
            text=best_candidate.normalized_text,
            confidence=best_candidate.confidence,
            source_type=source_type,
            source=source_val,
            method="tesseract",
            pages=1,
            requires_verification=requires_verification,
            warnings=warnings,
            page_results=[page_res],
            ocr_provider="tesseract",
            quality_status=quality_status,
            quality_reason=quality_reason,
            quality_metrics=quality_metrics
        )


tesseract_strategy_engine = TesseractStrategyEngine()
