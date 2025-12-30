from loguru import logger
from app.crud.audit_log import write_audit_log
from app.crud.error_log import write_error_log
from app.crud.job_status import update_job_status
from app.crud.draft import create_draft
from app.crud.ocr import insert_ocr_page
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

def process_document_task(case_id, doc_id, file_path, document_name,session_id ):
    """ End-to-end document processing pipeline. Flow: - Draft record - OCR OR direct text ingestion - Classification - Final JSON creation """ 
    os.makedirs("uploads", exist_ok=True)
    try:
        
        logger.info(f"PROCESS PID={os.getpid()} DOC={doc_id}")
        logger.info(f"Starting processing: {document_name} | Document ID: {doc_id}")
        write_audit_log(case_id, doc_id, "PROCESSING_STARTED",
                        "Document processing started", "SYSTEM")
        update_job_status(doc_id, "PROCESSING")
        create_draft(session_id,case_id, doc_id, document_name, file_path)
        write_audit_log(case_id, doc_id, "OCR_STARTED",
                        "OCR started", "OCR")

        if is_text_file(file_path):
            logger.info("Text file detected — skipping OCR")
            text = read_text_file(file_path)
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

