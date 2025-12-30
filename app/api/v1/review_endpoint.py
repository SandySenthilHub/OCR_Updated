from fastapi import APIRouter, Body
from app.crud.final_ocr import (
    get_final_ocr,
    update_final_ocr,
    approve_final_ocr
)
from app.services.document_summary_service import create_document_summary
from app.crud.audit_log import write_audit_log

router = APIRouter(prefix="/review", tags=["Human Review"])


@router.get("/{doc_id}")
def fetch_for_review(doc_id: str):
    return get_final_ocr(doc_id)


@router.put("/{doc_id}")
def save_edits(
    doc_id: str,
    documents_json: str = Body(...),
    user: str = Body(...)
):
    update_final_ocr(doc_id, documents_json, user)
    write_audit_log(None, doc_id, "FINAL_OCR_EDITED",
                    "Reviewer updated OCR content", user)
    return {"status": "SAVED"}


@router.post("/{doc_id}/approve")
def approve(doc_id: str, user: str = Body(...)):
    approve_final_ocr(doc_id, user)

    # 🔐 One-time publish
    create_document_summary(doc_id)

    write_audit_log(
        None,
        doc_id,
        "FINAL_OCR_APPROVED",
        "Approved and locked",
        user
    )

    return {"status": "APPROVED"}
