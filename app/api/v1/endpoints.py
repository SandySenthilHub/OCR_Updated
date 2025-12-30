from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Query
import os

from app.services.case_id_service import generate_case_id
from app.services.doc_id_service import generate_doc_id
from app.services.document_processor import process_document_task
from app.crud.job_status import create_job
from app.workers.document_worker import submit_document_job


from app.crud.draft import get_drafts_by_session
from app.crud.draft import get_ocr_by_draft_id
from app.crud.draft import get_classification_by_draft_id
from app.crud.draft import get_final_ocr_by_draft_id
from app.crud.draft import get_summary_by_draft_id
from loguru import logger
from pydantic import BaseModel

from app.crud.session import create_session, get_all_sessions, create_customer, get_customer
from app.crud.lifecycle import (
    get_all_lifecycles,
    add_documents_to_lifecycle,
    delete_document_from_lifecycle
)

router = APIRouter()


class TextUploadRequest(BaseModel):
    session_id: str  
    product: str
    document_name: str
    content: str
    

# Absolute path to the 'uploads' folder inside the app
BASE_DIR = os.path.dirname(os.path.abspath(__file__))  # folder where this file lives
UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)    


@router.post("/upload-text-json")
async def upload_text(payload: TextUploadRequest):
    session_id = payload.session_id  
    case_id = generate_case_id(payload.product)
    doc_id = generate_doc_id(case_id)

    filename = f"{doc_id}_{payload.document_name}.txt"
    file_path = os.path.join(UPLOAD_DIR, filename)

    with open(file_path, "w", encoding="utf-8") as f:
        f.write(payload.content)

    create_job(doc_id, case_id, file_path)

    submit_document_job(
        process_document_task,
        case_id,
        doc_id,
        file_path,
        payload.document_name,
        session_id    
    )

    return {
        "case_id": case_id,
        "doc_id": doc_id,
        "status": "QUEUED",
        "source": "TEXT"
    }


@router.post("/upload-bulk")
async def upload_documents(
    product: str = Form(...),
    files: list[UploadFile] = File(...),
    session_id: str = Form(...),
):
    logger.info(f"📌 Received session_id: {session_id}")

    case_id = generate_case_id(product)
    response = []

    for file in files:
        doc_id = generate_doc_id(case_id)
        filename = f"{doc_id}_{file.filename}"  # unique filename
        file_path = os.path.join(UPLOAD_DIR, filename)

        with open(file_path, "wb") as f:
            f.write(await file.read())

        create_job(doc_id, case_id, file_path)

        # Submit background processing
        submit_document_job(
            process_document_task,
            case_id,
            doc_id,
            file_path,
            file.filename,
            session_id
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



# ----------------------------
# GET endpoints by session_id
# ----------------------------
@router.get("/drafts/current/{session_id}")
def get_current_draft(session_id: str):
    draft = get_drafts_by_session(session_id)
    if not draft:
        raise HTTPException(status_code=404, detail="No draft found for session")
    return draft


@router.get("/ocr/current/{session_id}")
def ocr(session_id: str):
    records = get_ocr_by_draft_id(session_id)
    return records or []


@router.get("/classification/current/{session_id}")
def classification(session_id: str):
    records = get_classification_by_draft_id(session_id)
    return records or []


@router.get("/final_ocr/current/{session_id}")
def final_ocr(session_id: str):
    records = get_final_ocr_by_draft_id(session_id)
    return records or []


@router.get("/summary/current/{session_id}")
def summary(session_id: str):
    records = get_summary_by_draft_id(session_id)
    return records or []



# Sessions

@router.post("/sessions")
def create(payload: dict):
    return create_session(payload)

@router.get("/sessions")
def list_sessions(user_id: str | None = None):
    return get_all_sessions(user_id)


# lifecycles 



@router.get("/lifecycles")
def list_lifecycles():
    return get_all_lifecycles()


@router.post("/{id}/add-documents")
def add_documents(id: int, payload: dict):
    required_documents = payload.get("required_documents")

    if not required_documents or not isinstance(required_documents, list):
        raise HTTPException(
            status_code=400,
            detail="At least one document is required."
        )

    try:
        docs = add_documents_to_lifecycle(id, required_documents)
        return {
            "message": "Documents updated successfully.",
            "required_documents": docs
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.delete("/{id}/delete-document")
def delete_document(id: int, payload: dict):
    document_name = payload.get("document_name")

    if not document_name:
        raise HTTPException(
            status_code=400,
            detail="Missing document_name"
        )

    try:
        delete_document_from_lifecycle(id, document_name)
        return {
            "message": f"Document '{document_name}' deleted successfully"
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    
    
    # Customer 
    
@router.post("/save-customers")
def create_customer_api(payload: dict):
    return create_customer(payload)


@router.get("/get-customer")
def get_customer_api(
    cifNumber: str | None = Query(None),
    customerId: str | None = Query(None),
):
    return get_customer(cifNumber, customerId)