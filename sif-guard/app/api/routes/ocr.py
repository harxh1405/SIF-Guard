from fastapi import APIRouter, UploadFile, File, HTTPException
from app.services.ocr.service import ocr_service
from app.services.ocr.schemas import OCRResultSchema
from app.core.config import settings

router = APIRouter()


@router.post("/ocr/extract", response_model=OCRResultSchema)
async def extract_document_ocr(file: UploadFile = File(...)):
    """
    Extracts text from uploaded Image (PNG, JPG, JPEG) or PDF document using OCR quality gates.
    Returns structured text, confidence score, source type, and verification flag.
    """
    if not file or not file.filename:
        raise HTTPException(status_code=400, detail="No file provided in request.")

    filename = file.filename.lower()
    allowed_extensions = (".png", ".jpg", ".jpeg", ".webp", ".pdf")
    if not filename.endswith(allowed_extensions):
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file format '{file.filename}'. Allowed extensions: PNG, JPG, JPEG, WEBP, PDF."
        )

    contents = await file.read()
    if not contents or len(contents) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty (0 bytes).")

    # Validate max file size
    max_bytes = int(settings.OCR_MAX_FILE_SIZE_MB * 1024 * 1024)
    if len(contents) > max_bytes:
        raise HTTPException(
            status_code=400,
            detail=f"File size exceeds maximum threshold of {settings.OCR_MAX_FILE_SIZE_MB}MB."
        )

    try:
        result = ocr_service.extract(contents, file.filename)
        return result
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"OCR processing failed for '{file.filename}': {str(e)}"
        )
