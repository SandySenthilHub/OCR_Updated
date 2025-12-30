# =====================================================
# AUTO-GENERATED FLATTENED BACKEND FILE
# SOURCE: trade-document-processor
# =====================================================



# =====================================================
# FILE: app\api\v1\endpoints.py
# =====================================================

from fastapi import APIRouter, UploadFile, File, Form
import os

from app.services.case_id_service import generate_case_id
from app.services.doc_id_service import generate_doc_id
from app.services.document_processor import process_document_task
from app.crud.job_status import create_job
from app.workers.document_worker import submit_document_job

router = APIRouter()

@router.post("/upload-bulk")
async def upload_documents(
    product: str = Form(...),
    files: list[UploadFile] = File(...)
):
    os.makedirs("uploads", exist_ok=True)

    # 1️⃣ Create CASE ID (ONCE)
    case_id = generate_case_id(product)

    response = []

    # 2️⃣ Process EACH document independently
    for file in files:
        file_path = f"uploads/{file.filename}"

        with open(file_path, "wb") as f:
            f.write(await file.read())

        # 3️⃣ Create DOC ID (PER FILE)
        doc_id = generate_doc_id(case_id)

        # 4️⃣ Create job (QUEUED)
        create_job(
            doc_id=doc_id,
            case_id=case_id,
            file_path=file_path
        )

        # 5️⃣ 🔥 TRUE PARALLEL EXECUTION 🔥
        submit_document_job(
            process_document_task,
            case_id,
            doc_id,
            file_path,
            file.filename
        )

        response.append({
            "doc_id": doc_id,
            "file_name": file.filename,
            "status": "QUEUED"
        })

    return {
        "case_id": case_id,
        "documents": response
    }



# =====================================================
# FILE: app\config.py
# =====================================================

# app/config.py
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseSettings):
    # -------------------------------
    # Azure AI Configuration
    # -------------------------------
    AZURE_DOC_ENDPOINT: str
    AZURE_DOC_KEY: str

    AZURE_OPENAI_ENDPOINT: str
    AZURE_OPENAI_KEY: str
    AZURE_DEPLOYMENT_NAME: str = "gpt-4o"

    # -------------------------------
    # Database Configuration (MSSQL)
    # -------------------------------
    DB_SERVER: str
    DB_DATABASE: str
    DB_USER: str
    DB_PASSWORD: str
    DB_PORT: int = 1433
    DB_ENCRYPT: str = "no"
    DB_TRUST_SERVER_CERTIFICATE: str = "yes"

    model_config = {
        "env_file": ".env",
        "case_sensitive": False
    }

settings = Settings()



# =====================================================
# FILE: app\crud\audit_log.py
# =====================================================

from app.database import get_connection

def write_audit_log(case_id, doc_id, action, message, source):
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "{CALL sp_write_audit_log (?, ?, ?, ?, ?)}",
            (case_id, doc_id, action, message, source)
        )
        conn.commit()



# =====================================================
# FILE: app\crud\classification.py
# =====================================================

from app.database import get_connection

def insert_classification(
    case_id, doc_id, file_path, page_no,
    code, name, extracted_text, is_external
):
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "{CALL sp_insert_classification (?, ?, ?, ?, ?, ?, ?, ?)}",
            (case_id, doc_id, file_path, page_no,
             code, name, extracted_text, int(is_external))
        )
        conn.commit()



# =====================================================
# FILE: app\crud\document_summary.py
# =====================================================

from app.database import get_connection

def create_document_summary_table():
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
        IF NOT EXISTS (
            SELECT * FROM sysobjects WHERE name='OF_document_summary' AND xtype='U'
        )
        CREATE TABLE OF_document_summary (
            case_id VARCHAR(100),
            doc_id VARCHAR(36) PRIMARY KEY,
            file_path NVARCHAR(500),
            document_name NVARCHAR(255),
            product NVARCHAR(50),
            document_list NVARCHAR(500),
            documents_json NVARCHAR(MAX),
            created_at DATETIME DEFAULT GETDATE()
        )
        """)
        conn.commit()

def insert_document_summary(
    case_id, doc_id, file_path,
    document_name, product,
    document_list, documents_json
):
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
        INSERT INTO OF_document_summary
        VALUES (?, ?, ?, ?, ?, ?, ?, GETDATE())
        """, (
            case_id, doc_id, file_path,
            document_name, product,
            document_list, documents_json
        ))
        conn.commit()



# =====================================================
# FILE: app\crud\draft.py
# =====================================================

from app.database import get_connection

def create_draft(case_id, doc_id, document_name, file_path):
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "{CALL sp_create_draft (?, ?, ?, ?)}",
            (case_id, doc_id, document_name, file_path)
        )
        conn.commit()



# =====================================================
# FILE: app\crud\error_log.py
# =====================================================

from app.database import get_connection
import traceback

def write_error_log(case_id, doc_id, step, error):
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "{CALL sp_write_error_log (?, ?, ?, ?)}",
            (case_id, doc_id, step, str(error))
        )
        conn.commit()



# =====================================================
# FILE: app\crud\final_ocr.py
# =====================================================

import json
from app.database import get_connection

def create_final_record(case_id, doc_id, file_path, whole_text, documents_json):
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "{CALL sp_insert_final_ocr (?, ?, ?, ?, ?)}",
            (case_id, doc_id, file_path, whole_text, documents_json)
        )
        conn.commit()



# =====================================================
# FILE: app\crud\job_status.py
# =====================================================

from app.database import get_connection

def create_job(doc_id, case_id, file_path):
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "{CALL sp_create_job (?, ?, ?)}",
            (doc_id, case_id, file_path)
        )
        conn.commit()

def update_job_status(doc_id, status, error_message=None):
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "{CALL sp_update_job_status (?, ?, ?)}",
            (doc_id, status, error_message)
        )
        conn.commit()



# =====================================================
# FILE: app\crud\ocr.py
# =====================================================

from app.database import get_connection


def create_ocr_table():
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("{CALL sp_create_ocr_table}")
    conn.commit()

    cursor.close()
    conn.close()


def insert_ocr_page(
    case_id: str,
    doc_id: str,
    file_path: str,
    page_no: int,
    extracted_text: str,
    signature_stamp: str
):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        "{CALL sp_insert_ocr_page (?, ?, ?, ?, ?, ?)}",
        (
            case_id,
            doc_id,
            file_path,
            page_no,
            extracted_text,
            signature_stamp
        )
    )

    conn.commit()
    cursor.close()
    conn.close()


def get_ocr_pages(doc_id: str):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("{CALL sp_get_ocr_pages (?)}", (doc_id,))
    rows = cursor.fetchall()

    cursor.close()
    conn.close()
    return rows



# =====================================================
# FILE: app\database.py
# =====================================================

# app/database.py
import pyodbc
from app.config import settings

def get_connection():
    conn_str = (
        "DRIVER={ODBC Driver 18 for SQL Server};"
        f"SERVER={settings.DB_SERVER},{settings.DB_PORT};"
        f"DATABASE={settings.DB_DATABASE};"
        f"UID={settings.DB_USER};"
        f"PWD={settings.DB_PASSWORD};"
        f"Encrypt={settings.DB_ENCRYPT};"
        f"TrustServerCertificate={settings.DB_TRUST_SERVER_CERTIFICATE};"
        "Connection Timeout=60;"
    )
    return pyodbc.connect(conn_str)



# =====================================================
# FILE: app\main.py
# =====================================================

from fastapi import FastAPI, UploadFile, File, BackgroundTasks
from loguru import logger
from app.api.v1.endpoints import router as v1_router
from app.services.document_processor import process_document_task

app = FastAPI(title="Trade Document AI Processor", version="1.0.0")

app.include_router(v1_router, prefix="/api/v1")



@app.get("/health")
async def health():
    return {"status": "healthy"}

@app.post("/upload")
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    document_name: str = "uploaded.pdf"
):
    file_path = f"uploads/{file.filename}"
    with open(file_path, "wb") as f:
        content = await file.read()
        f.write(content)

    background_tasks.add_task(process_document_task, file_path, document_name)
    logger.info(f"Document {document_name} queued for processing")
    return {"message": "Document queued", "filename": file.filename}


# =====================================================
# FILE: app\prompts.py
# =====================================================

# prompts.py

SIGNATURE_STAMP_PROMPT = """
Analyze this document page image carefully for any stamps, signatures, seals, or handwritten marks.
Describe:
- Whether a signature or stamp is present
- Location (top, bottom, left, right, center)
- Any readable text inside the stamp/signature
- Confidence (high/medium/low)
If none found, say "No signature or stamp detected."
"""

CLASSIFICATION_PROMPT_TEMPLATE = """
You are a senior international trade documentation specialist.

Your task:
Classify the given page into EXACTLY ONE document type from the list below.

Available document types (authoritative master list):
{types_descriptions}

CRITICAL DISAMBIGUATION RULES (FOLLOW STRICTLY):

1. The word "certificate" alone is NOT sufficient to classify.
2. Determine the document PURPOSE, not the title.

Purpose-based classification rules:
- If content refers to country of origin, origin criteria, exporter country → Certificate of Origin
- If content refers to net/gross weight, measurements, weight declaration → Weight List or Certificate of Weight
- If content refers to compliance, conformity, standards, declarations → Certificate of Compliance
- If content refers to invoice,goods, price, amount, total value → Commercial Invoice
- If content refers to packing, cartons, dimensions → Packing List
- If content refers to vessel, shipment, ports, consignee → Bill of Lading

Additional rules:
- Prefer the CLOSEST MATCH from the list.
- Use 'unknown' ONLY if no document type reasonably applies.
- Ignore company letterheads and addresses.
- Repeated pages of the same document must return the SAME code.

Output format (STRICT):
Return exactly ONE line:
CODE|DOCUMENT_NAME

Examples:
INV|commercial_invoice
PL|packing_list
BL|bill_of_lading
CoO|certificate_of_origin
unknown|unknown

Document page content:
{content}

Answer:
"""


EXTERNAL_DOC_INFERENCE_PROMPT = """
You are an expert in trade, banking, insurance, and commercial documentation.

Based ONLY on the content below:
1. Identify what type of document this most likely is
2. Respond with a SHORT document name (max 5 words)
3. Do NOT invent codes
4. Do NOT add explanations

Examples:
- "Insurance Policy"
- "Bank Advice"
- "Delivery Note"
- "Customer Application Form"

Document content:
{content}

Output only the document name:
"""



# =====================================================
# FILE: app\schemas.py
# =====================================================

from pydantic import BaseModel
from uuid import UUID

class DocumentUploadResponse(BaseModel):
    message: str
    filename: str
    document_id: UUID | None = None

class ProcessingStatus(BaseModel):
    document_id: UUID
    status: str
    message: str


# =====================================================
# FILE: app\services\case_id_service.py
# =====================================================

from datetime import datetime
from app.database import get_connection

def create_case_sequence_table():
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
        IF NOT EXISTS (
            SELECT * FROM sysobjects
            WHERE name='OF_case_sequence' AND xtype='U'
        )
        CREATE TABLE OF_case_sequence (
            product VARCHAR(50),
            seq_date VARCHAR(8),
            last_seq INT,
            CONSTRAINT PK_OF_case_sequence PRIMARY KEY (product, seq_date)
        )
        """)
        conn.commit()

def generate_case_id(product: str) -> str:
    create_case_sequence_table()
    today = datetime.utcnow().strftime("%Y%m%d")
    product = product.upper()

    with get_connection() as conn:
        cursor = conn.cursor()

        cursor.execute("""
        SELECT last_seq FROM OF_case_sequence
        WHERE product = ? AND seq_date = ?
        """, (product, today))
        row = cursor.fetchone()

        if row:
            seq = row[0] + 1
            cursor.execute("""
            UPDATE OF_case_sequence
            SET last_seq = ?
            WHERE product = ? AND seq_date = ?
            """, (seq, product, today))
        else:
            seq = 1
            cursor.execute("""
            INSERT INTO OF_case_sequence (product, seq_date, last_seq)
            VALUES (?, ?, ?)
            """, (product, today, seq))

        conn.commit()

    return f"CASE-{today}-{seq:04d}"



# =====================================================
# FILE: app\services\classification_service.py
# =====================================================

from openai import AzureOpenAI
from loguru import logger
from app.database import get_connection
from app.config import settings
from app.crud.classification import insert_classification
from app.prompts import CLASSIFICATION_PROMPT_TEMPLATE, EXTERNAL_DOC_INFERENCE_PROMPT

azure_client = AzureOpenAI(
    azure_endpoint=settings.AZURE_OPENAI_ENDPOINT,
    api_key=settings.AZURE_OPENAI_KEY,
    api_version="2024-02-15-preview"
)

def load_document_forms():
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT code, document_name, sender, receiver
            FROM OF_document_forms
        """)
        rows = cursor.fetchall()

    code_to_name, name_to_code, valid_codes, desc = {}, {}, set(), []

    for code, name, sender, receiver in rows:
        code = code.strip().upper()
        key = (
            name.lower()
            .replace(" ", "_")
            .replace("/", "_")
            .replace("-", "_")
        )
        code_to_name[code] = key
        name_to_code[key] = code
        valid_codes.add(code)
        desc.append(f"{code}: {name} ({sender} → {receiver})")

    return code_to_name, name_to_code, valid_codes | {"unknown"}, "\n".join(desc)

def classify_pages(case_id, doc_id, file_path):
    code_to_name, name_to_code, valid_codes, types_desc = load_document_forms()

    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT page_no, extracted_text
            FROM OF_ocr
            WHERE doc_id = ?
        """, (doc_id,))
        pages = cursor.fetchall()

    for page_no, text_ in pages:

        if not text_:
            insert_classification(
                case_id, doc_id, file_path, page_no,
                "unknown", "unknown", text_, 0
            )
            continue

        prompt = CLASSIFICATION_PROMPT_TEMPLATE.format(
            types_descriptions=types_desc,
            content=text_[:12000]
        )

        try:
            resp = azure_client.chat.completions.create(
                model=settings.AZURE_DEPLOYMENT_NAME,
                messages=[{"role": "user", "content": prompt}],
                max_tokens=10,
                temperature=0.0
            )
            code = resp.choices[0].message.content.strip().upper()
        except Exception:
            code = "unknown"

        if code in valid_codes and code != "unknown":
            insert_classification(
                case_id, doc_id, file_path, page_no,
                code, code_to_name[code], text_, 0
            )
        else:
            resp = azure_client.chat.completions.create(
                model=settings.AZURE_DEPLOYMENT_NAME,
                messages=[{
                    "role": "user",
                    "content": EXTERNAL_DOC_INFERENCE_PROMPT.format(
                        content=text_[:8000]
                    )
                }],
                max_tokens=10,
                temperature=0.2
            )

            name = (
                resp.choices[0]
                .message.content.strip()
                .lower()
                .replace(" ", "_")
            )

            mapped = name_to_code.get(name)

            insert_classification(
                case_id, doc_id, file_path, page_no,
                mapped or "unknown",
                name,
                text_,
                mapped is None
            )



# =====================================================
# FILE: app\services\doc_id_service.py
# =====================================================

from app.database import get_connection

def generate_doc_id(case_id: str) -> str:
    """
    Generates incremental DOC ID per case.
    Format: DOC-<CASE_ID>-001
    """

    with get_connection() as conn:
        cursor = conn.cursor()

        cursor.execute("""
            SELECT COUNT(*)
            FROM OF_document_job_status
            WHERE case_id = ?
        """, (case_id,))

        seq = (cursor.fetchone()[0] or 0) + 1

    return f"DOC-{case_id}-{seq:03d}"



# =====================================================
# FILE: app\services\document_processor.py
# =====================================================

from loguru import logger
from app.crud.audit_log import write_audit_log
from app.crud.error_log import write_error_log
from app.crud.job_status import update_job_status
from app.crud.draft import create_draft
from app.crud.ocr import create_ocr_table, insert_ocr_page
from app.services.ocr_service import perform_ocr_with_vision
from app.services.classification_service import classify_pages
from app.crud.final_ocr import create_final_record
from app.services.document_summary_service import create_document_summary
import os
def is_text_file(p): 
    """ Returns True if file is a plain text file. Extendable later for docx, html, etc. """
    return p.lower().endswith(".txt")

def read_text_file(p):
    """ Reads plain text file safely. """
    with open(p, "r", encoding="utf-8", errors="ignore") as f:
        return f.read()

def process_document_task(case_id, doc_id, file_path, document_name):
    """ End-to-end document processing pipeline. Flow: - Draft record - OCR OR direct text ingestion - Classification - Final JSON creation """ 
    os.makedirs("uploads", exist_ok=True)
    try:
        logger.info(f"Starting processing: {document_name} | Document ID: {doc_id}")
        write_audit_log(case_id, doc_id, "PROCESSING_STARTED",
                        "Document processing started", "SYSTEM")
        update_job_status(doc_id, "PROCESSING")
        create_draft(case_id, doc_id, document_name, file_path)
        write_audit_log(case_id, doc_id, "OCR_STARTED",
                        "OCR started", "OCR")

        if is_text_file(file_path):
            logger.info("Text file detected — skipping OCR")
            text = read_text_file(file_path)
            create_ocr_table()
            insert_ocr_page(case_id, doc_id, file_path, 1, text, "N/A")
            whole_text = text
        else:
            whole_text = perform_ocr_with_vision(case_id, doc_id, file_path)
        write_audit_log(case_id, doc_id, "OCR_COMPLETED",
                        "OCR completed", "OCR")
        classify_pages(case_id, doc_id, file_path)
        write_audit_log(case_id, doc_id, "CLASSIFICATION_COMPLETED",
                        "Classification completed", "CLASSIFICATION")
        create_final_record(case_id, doc_id, file_path, whole_text)
        write_audit_log(case_id, doc_id, "FINAL_JSON_CREATED",
                        "Final JSON created", "SYSTEM")
        create_document_summary(case_id, doc_id, file_path, document_name)

        update_job_status(doc_id, "COMPLETED")
        write_audit_log(case_id, doc_id, "PROCESSING_COMPLETED",
                        "Document processed successfully", "SYSTEM")
        logger.success( f"Successfully processed '{document_name}' | Document ID: {doc_id}" ) 
        
    except Exception as e:
        write_error_log(
            case_id=case_id,
            doc_id=doc_id,
            step="DOCUMENT_PROCESSOR",
            error=e
        )

        write_audit_log(
            case_id, doc_id,
            "PROCESSING_FAILED",
            str(e),
            "SYSTEM"
        )
        update_job_status(doc_id, "FAILED", str(e))
        logger.error( f"Failed processing '{document_name}' | Document ID: {doc_id} | Error: {str(e)}" )
        raise



# =====================================================
# FILE: app\services\document_summary_service.py
# =====================================================

from app.database import get_connection
from app.crud.document_summary import create_document_summary_table, insert_document_summary

def detect_product(document_codes: set) -> str:
    """
    Determines product type based on classified document codes.
    """

    trade_docs = {
        "letter_of_credit", "Bill_of_Lading", "bill_of_exchange", "invoice", "Paking_List", "Certificate_of_Origin", "AirWayBill", "sea_way_Bill"
    }

    insurance_docs = {
        "POL", "POLICY", "INS_POLICY", "INS_CERT",
        "CLAIM", "CLAIM_FORM", "ENDORSEMENT"
    }

    rfo_docs = {
        "KYC", "APPLICATION", "CONSENT", "UNDERTAKING"
    }

    if document_codes & trade_docs:
        return "Trade Finance"

    if document_codes & insurance_docs:
        return "Insurance"

    if document_codes & rfo_docs:
        return "RFO"

    return "Unknown"


def create_document_summary(case_id, doc_id, file_path, document_name):
    create_document_summary_table()

    with get_connection() as conn:
        cursor = conn.cursor()

        cursor.execute("""
        SELECT DISTINCT classified_name
        FROM OF_classification
        WHERE doc_id = ? AND classified_name <> 'unknown'
        """, (doc_id,))
        document_names = {r[0] for r in cursor.fetchall()}
        document_list = ",".join(sorted(document_names))
        product = detect_product(document_names)

        cursor.execute("""
        SELECT documents_json FROM OF_final_ocr WHERE doc_id = ?
        """, (doc_id,))
        row = cursor.fetchone()
        documents_json = row[0] if row else "{}"

    insert_document_summary(
        case_id, doc_id, file_path,
        document_name, product,
        document_list, documents_json
    )



# =====================================================
# FILE: app\services\ocr_service.py
# =====================================================

# app/services/ocr_service.py

import fitz  # PyMuPDF
import base64
from azure.ai.documentintelligence import DocumentIntelligenceClient
from azure.core.credentials import AzureKeyCredential
from openai import AzureOpenAI
from app.config import settings
from app.crud.ocr import create_ocr_table, insert_ocr_page
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
    create_ocr_table()
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


# =====================================================
# FILE: app\services\utils.py
# =====================================================




# =====================================================
# FILE: app\workers\document_worker.py
# =====================================================

from concurrent.futures import ProcessPoolExecutor

executor = ProcessPoolExecutor(max_workers=4)

def submit_document_job(fn, *args):
    executor.submit(fn, *args)



# =====================================================
# FILE: scripts\process_single.py
# =====================================================

import sys
from app.services.document_processor import process_document_task

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python scripts/process_single.py <path_to_pdf>")
        sys.exit(1)
    pdf_path = sys.argv[1]
    process_document_task(pdf_path, os.path.basename(pdf_path))
