# app/services/ocr_service.py

import fitz  # PyMuPDF
import base64
from azure.ai.documentintelligence import DocumentIntelligenceClient
from azure.core.credentials import AzureKeyCredential
from openai import AzureOpenAI
from app.config import settings
from app.crud.ocr import insert_ocr_page
from app.prompts import SIGNATURE_STAMP_PROMPT
from loguru import logger


# Initialize Azure Document Intelligence client
di_client = DocumentIntelligenceClient(
    endpoint=settings.AZURE_DOC_ENDPOINT,
    credential=AzureKeyCredential(settings.AZURE_DOC_KEY)
)

# Initialize Azure OpenAI client for GPT-4o vision
azure_client = AzureOpenAI(
    azure_endpoint=settings.AZURE_OPENAI_ENDPOINT,
    api_key=settings.AZURE_OPENAI_KEY,
    api_version="2024-02-15-preview"
)


def perform_ocr_with_vision(case_id: str,doc_id: str, file_path: str) -> str:
    """
    Performs OCR using Azure Document Intelligence and enhances with GPT-4o vision
    for stamp/signature detection using PyMuPDF for fast, high-quality image rendering.
    Returns the concatenated text of the entire document.
    """
    logger.info(f"Starting OCR + Vision analysis for document ID: {doc_id}")

    # Step 1: Azure Document Intelligence for layout and text extraction
    with open(file_path, "rb") as f:
        poller = di_client.begin_analyze_document(
            "prebuilt-layout",
            analyze_request=f,
            content_type="application/octet-stream"
        )
        result = poller.result()

    # Step 2: Open PDF with PyMuPDF for fast page-to-image conversion
    pdf_doc = fitz.open(file_path)
    whole_text = ""

    for page_num in range(len(pdf_doc)):
        page = pdf_doc[page_num]
        di_page = result.pages[page_num]

        # Extract text from Azure Document Intelligence
        extracted_text = ""
        if di_page.lines:
            extracted_text = "\n".join([line.content for line in di_page.lines])
        whole_text += extracted_text + "\n\n"

        # Render page to high-quality JPEG image using PyMuPDF
        zoom = 2.0  # 2x zoom = ~150 DPI (good balance of quality and speed)
        mat = fitz.Matrix(zoom, zoom)
        pix = page.get_pixmap(matrix=mat, alpha=False)  # No transparency

        # Convert to base64 for GPT-4o vision
        img_bytes = pix.tobytes("jpeg")
        base64_image = base64.b64encode(img_bytes).decode("utf-8")

        # GPT-4o vision analysis for stamps and signatures
        try:
            response = azure_client.chat.completions.create(
                model=settings.AZURE_DEPLOYMENT_NAME,
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": SIGNATURE_STAMP_PROMPT},
                            {
                                "type": "image_url",
                                "image_url": {"url": f"data:image/jpeg;base64,{base64_image}"}
                            }
                        ]
                    }
                ],
                max_tokens=300,
                temperature=0.0
            )
            signature_stamp = response.choices[0].message.content.strip()
        except Exception as e:
            logger.warning(f"Vision analysis failed for page {page_num + 1}: {e}")
            signature_stamp = "Vision analysis failed - could not analyze image"

        # Save extracted text and signature/stamp info to OCR table
        insert_ocr_page(case_id,doc_id,file_path,page_num + 1, extracted_text, signature_stamp)

    pdf_doc.close()
    logger.info(f"OCR + Vision analysis completed for document ID: {doc_id}")
    return whole_text.strip()