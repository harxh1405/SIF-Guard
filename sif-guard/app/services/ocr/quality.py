import io
from dataclasses import dataclass
from typing import Optional, Dict, Any
import numpy as np
from PIL import Image


@dataclass
class ImageQualityResult:
    is_acceptable: bool
    quality_status: str  # "good", "warning", "poor"
    reason: Optional[str] = None  # e.g. "image_too_blurry", "image_too_dark", "image_too_bright", "image_low_contrast", "image_empty", "image_too_small"
    metrics: Dict[str, float] = None


class ImageQualityAssessor:
    """
    Evaluates visual quality of images before OCR execution.
    Screens for blur, under/over-exposure, contrast deficiency, and empty frames.
    """

    MIN_DIMENSION: int = 100
    BLUR_THRESHOLD: float = 35.0
    MIN_BRIGHTNESS: float = 20.0
    MAX_BRIGHTNESS: float = 248.0
    MIN_CONTRAST_STD: float = 8.0

    @classmethod
    def assess_image_quality(cls, image_bytes: bytes) -> ImageQualityResult:
        if not image_bytes or len(image_bytes) < 100:
            return ImageQualityResult(
                is_acceptable=False,
                quality_status="poor",
                reason="image_empty",
                metrics={"byte_size": float(len(image_bytes) if image_bytes else 0)}
            )

        try:
            img = Image.open(io.BytesIO(image_bytes))
        except Exception as e:
            return ImageQualityResult(
                is_acceptable=False,
                quality_status="poor",
                reason="image_corrupted",
                metrics={"byte_size": float(len(image_bytes))}
            )

        w, h = img.size
        if w < cls.MIN_DIMENSION or h < cls.MIN_DIMENSION:
            return ImageQualityResult(
                is_acceptable=False,
                quality_status="poor",
                reason="image_too_small",
                metrics={"width": float(w), "height": float(h)}
            )

        # Convert to grayscale array for mathematical analysis
        if img.mode in ("RGBA", "P", "LA"):
            img = img.convert("RGB")
        gray = img.convert("L")
        arr = np.array(gray, dtype=np.float32)

        mean_brightness = float(np.mean(arr))
        contrast_std = float(np.std(arr))

        # Pure numpy Laplacian variance for blur detection (zero boundary padding artifacts)
        if arr.shape[0] >= 3 and arr.shape[1] >= 3:
            d2x = arr[1:-1, 2:] - 2 * arr[1:-1, 1:-1] + arr[1:-1, :-2]
            d2y = arr[2:, 1:-1] - 2 * arr[1:-1, 1:-1] + arr[:-2, 1:-1]
            lap = d2x + d2y
            blur_variance = float(np.var(lap))
        else:
            blur_variance = 0.0

        metrics = {
            "width": float(w),
            "height": float(h),
            "byte_size": float(len(image_bytes)),
            "mean_brightness": round(mean_brightness, 2),
            "contrast_std": round(contrast_std, 2),
            "blur_variance": round(blur_variance, 2)
        }

        # 1. Empty / Uniform image
        if contrast_std < cls.MIN_CONTRAST_STD and blur_variance < 5.0:
            return ImageQualityResult(
                is_acceptable=False,
                quality_status="poor",
                reason="image_empty",
                metrics=metrics
            )

        # 2. Too dark (camera covered or low light)
        if mean_brightness < cls.MIN_BRIGHTNESS:
            return ImageQualityResult(
                is_acceptable=False,
                quality_status="poor",
                reason="image_too_dark",
                metrics=metrics
            )

        # 3. Too bright (overexposed / flash glare)
        if mean_brightness > cls.MAX_BRIGHTNESS and contrast_std < 12.0:
            return ImageQualityResult(
                is_acceptable=False,
                quality_status="poor",
                reason="image_too_bright",
                metrics=metrics
            )

        # 4. Low contrast
        if contrast_std < cls.MIN_CONTRAST_STD:
            return ImageQualityResult(
                is_acceptable=False,
                quality_status="poor",
                reason="image_low_contrast",
                metrics=metrics
            )

        # 5. Severe blur
        if blur_variance < cls.BLUR_THRESHOLD:
            return ImageQualityResult(
                is_acceptable=False,
                quality_status="poor",
                reason="image_too_blurry",
                metrics=metrics
            )

        # 6. Borderline warning zone
        if blur_variance < cls.BLUR_THRESHOLD * 1.5 or contrast_std < cls.MIN_CONTRAST_STD * 1.8:
            return ImageQualityResult(
                is_acceptable=True,
                quality_status="warning",
                reason=None,
                metrics=metrics
            )

        return ImageQualityResult(
            is_acceptable=True,
            quality_status="good",
            reason=None,
            metrics=metrics
        )


image_quality_assessor = ImageQualityAssessor()
