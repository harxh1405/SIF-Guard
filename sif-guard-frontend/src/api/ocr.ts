import { apiClient } from './client';

export interface OCRBoundingBox {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface OCRTokenResult {
  text: string;
  confidence: number;
  bbox?: OCRBoundingBox;
}

export interface OCRPageResult {
  page_number: number;
  text: string;
  confidence: number;
  tokens: OCRTokenResult[];
}

export interface OCRExtractResponse {
  text: string;
  extracted_text: string;
  confidence: number;
  source_type: string;
  pages: number;
  page_count: number;
  requires_verification: boolean;
  verification_required: boolean;
  warnings?: string[];
  page_results?: OCRPageResult[];
  ocr_provider: string;
  engine_used: string;
  filename?: string;
}

export async function extractDocumentOCR(file: File): Promise<OCRExtractResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await apiClient.post<any>('/ocr/extract', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  const data = res.data;
  const extractedText = data.text || data.extracted_text || '';
  const requiresVerification = data.requires_verification ?? data.verification_required ?? false;
  const pageCount = data.pages ?? data.page_count ?? 1;
  const provider = data.ocr_provider || data.engine_used || 'tesseract';

  return {
    ...data,
    text: extractedText,
    extracted_text: extractedText,
    confidence: typeof data.confidence === 'number' ? data.confidence : 0.85,
    source_type: data.source_type || 'pdf',
    pages: pageCount,
    page_count: pageCount,
    requires_verification: requiresVerification,
    verification_required: requiresVerification,
    warnings: data.warnings || [],
    page_results: data.page_results || [],
    ocr_provider: provider,
    engine_used: provider,
    filename: file.name,
  };
}
