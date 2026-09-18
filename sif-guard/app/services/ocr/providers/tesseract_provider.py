import io
from typing import List
import pytesseract
from PIL import Image

from app.services.ocr.base import BaseOCRProvider
from app.services.ocr.schemas import OCRResultSchema, OCRPageResult, OCRTokenResult, OCRBoundingBox
from app.services.ocr.preprocessing import preprocess_image_for_ocr, normalize_ocr_text
from app.core.config import settings
from app.core.logging import logger

try:
    import pypdf
    HAS_PYPDF = True
except Exception:
    HAS_PYPDF = False

try:
    from pdf2image import convert_from_bytes
    HAS_PDF2IMAGE = True
except Exception:
    HAS_PDF2IMAGE = False


class TesseractOCRProvider(BaseOCRProvider):
    """
    Open-source Tesseract OCR Provider implementation using pytesseract.
    """

    def extract_image(self, image_bytes: bytes, filename: str) -> OCRResultSchema:
        try:
            processed_img = preprocess_image_for_ocr(image_bytes)

            # Get detailed data with confidence and bounding boxes
            data = pytesseract.image_to_data(processed_img, output_type=pytesseract.Output.DICT)

            raw_text = pytesseract.image_to_string(processed_img)
            norm_text = normalize_ocr_text(raw_text)

            # Calculate mean confidence across non-empty tokens
            confidences = [
                float(c) for c in data.get("conf", []) if isinstance(c, (int, float)) and c > 0
            ]
            avg_conf = (sum(confidences) / len(confidences) / 100.0) if confidences else 0.85

            tokens = []
            for i in range(len(data.get("text", []))):
                word = data["text"][i].strip()
                conf = float(data["conf"][i]) if data["conf"][i] > 0 else 0.0
                if word:
                    tokens.append(
                        OCRTokenResult(
                            text=word,
                            confidence=round(conf / 100.0, 2),
                            bbox=OCRBoundingBox(
                                x1=float(data["left"][i]),
                                y1=float(data["top"][i]),
                                x2=float(data["left"][i] + data["width"][i]),
                                y2=float(data["top"][i] + data["height"][i]),
                            ),
                        )
                    )

            page_res = OCRPageResult(
                page_number=1,
                text=norm_text,
                confidence=round(avg_conf, 4),
                tokens=tokens,
            )

            requires_verification = avg_conf < settings.OCR_VERIFICATION_THRESHOLD

            return OCRResultSchema(
                text=norm_text,
                confidence=round(avg_conf, 4),
                source_type="image",
                pages=1,
                requires_verification=requires_verification,
                warnings=["Low OCR confidence - user verification recommended"] if requires_verification else [],
                page_results=[page_res],
                ocr_provider="tesseract",
            )
        except Exception as e:
            logger.error(f"Tesseract OCR image extraction error: {e}")
            # Graceful fallback text return if pytesseract binary is unavailable
            return OCRResultSchema(
                text="",
                confidence=0.0,
                source_type="image",
                pages=1,
                requires_verification=True,
                warnings=[f"OCR processing error: {str(e)}"],
                ocr_provider="tesseract",
            )

    def extract_pdf(self, pdf_bytes: bytes, filename: str) -> OCRResultSchema:
        warnings = []

        # 1. Attempt Native PDF text extraction first (Fast Path)
        if HAS_PYPDF:
            try:
                reader = pypdf.PdfReader(io.BytesIO(pdf_bytes))
                num_pages = len(reader.pages)
                extracted_pages = []
                full_text_parts = []
                has_native_text = False

                for idx, page in enumerate(reader.pages):
                    p_text = page.extract_text() or ""
                    if len(p_text.strip()) > 5:
                        has_native_text = True
                        norm_p_text = normalize_ocr_text(p_text)
                        full_text_parts.append(norm_p_text)
                        extracted_pages.append(
                            OCRPageResult(
                                page_number=idx + 1,
                                text=norm_p_text,
                                confidence=0.98,
                                tokens=[]
                            )
                        )

                full_text = "\n\n".join(full_text_parts)
                if has_native_text and len(full_text.strip()) > 30:  # Meaningful native text obtained
                    return OCRResultSchema(
                        text=full_text,
                        confidence=0.98,
                        source_type="pdf",
                        pages=num_pages,
                        requires_verification=False,
                        warnings=[],
                        page_results=extracted_pages,
                        ocr_provider="pypdf_native",
                    )
                else:
                    warnings.append("Native PDF text empty/insufficient. Processing embedded page images via OCR...")

                # 2. Extract embedded images from PDF pages for OCR (No external Poppler dependency required!)
                image_pages = []
                image_text_parts = []
                conf_list = []

                for idx, page in enumerate(reader.pages):
                    page_img_texts = []
                    page_tokens = []
                    page_confs = []

                    if hasattr(page, "images") and page.images:
                        for img_obj in page.images:
                            try:
                                img_data = img_obj.data
                                img_res = self.extract_image(img_data, getattr(img_obj, "name", "page_img.png"))
                                if img_res.text.strip():
                                    page_img_texts.append(img_res.text)
                                    page_confs.append(img_res.confidence)
                                    if img_res.page_results and img_res.page_results[0].tokens:
                                        page_tokens.extend(img_res.page_results[0].tokens)
                            except Exception as img_ex:
                                logger.warning(f"OCR extraction failed for embedded image on page {idx+1}: {img_ex}")

                    if page_img_texts:
                        combined_page_text = "\n".join(page_img_texts)
                        image_text_parts.append(combined_page_text)
                        avg_p_conf = sum(page_confs) / len(page_confs) if page_confs else 0.85
                        conf_list.append(avg_p_conf)
                        image_pages.append(
                            OCRPageResult(
                                page_number=idx + 1,
                                text=combined_page_text,
                                confidence=round(avg_p_conf, 4),
                                tokens=page_tokens
                            )
                        )

                if image_text_parts:
                    combined_full_text = "\n\n".join(image_text_parts)
                    if len(combined_full_text.strip()) > 10:
                        avg_conf = sum(conf_list) / len(conf_list) if conf_list else 0.85
                        requires_verification = avg_conf < settings.OCR_VERIFICATION_THRESHOLD
                        return OCRResultSchema(
                            text=combined_full_text,
                            confidence=round(avg_conf, 4),
                            source_type="pdf",
                            pages=num_pages,
                            requires_verification=requires_verification,
                            warnings=warnings,
                            page_results=image_pages,
                            ocr_provider="tesseract_pypdf_images",
                        )

            except Exception as ex:
                logger.warning(f"pypdf extraction failed: {ex}. Attempting fallback...")
                warnings.append(f"Native PDF parsing failed: {ex}.")

        # 3. System pdf2image fallback (if Poppler pdftoppm is installed)
        if HAS_PDF2IMAGE:
            try:
                images = convert_from_bytes(pdf_bytes)
                page_results = []
                full_text_parts = []
                conf_list = []

                for idx, img in enumerate(images):
                    buf = io.BytesIO()
                    img.save(buf, format="JPEG")
                    res = self.extract_image(buf.getvalue(), filename)
                    conf_list.append(res.confidence)
                    full_text_parts.append(res.text)
                    page_results.append(
                        OCRPageResult(
                            page_number=idx + 1,
                            text=res.text,
                            confidence=res.confidence,
                            tokens=res.page_results[0].tokens if res.page_results else []
                        )
                    )

                avg_conf = (sum(conf_list) / len(conf_list)) if conf_list else 0.80
                full_text = "\n\n".join(full_text_parts)
                requires_verification = avg_conf < settings.OCR_VERIFICATION_THRESHOLD

                return OCRResultSchema(
                    text=full_text,
                    confidence=round(avg_conf, 4),
                    source_type="pdf",
                    pages=len(images),
                    requires_verification=requires_verification,
                    warnings=warnings,
                    page_results=page_results,
                    ocr_provider="tesseract_pdf2image",
                )
            except Exception as e:
                logger.error(f"Scanned PDF OCR conversion error: {e}")

        return OCRResultSchema(
            text="",
            confidence=0.0,
            source_type="pdf",
            pages=1,
            requires_verification=True,
            warnings=warnings + ["Unable to perform OCR on PDF document. Please verify PDF file content or upload image."],
            ocr_provider="tesseract",
        )
