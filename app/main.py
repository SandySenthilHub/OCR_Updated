from fastapi import FastAPI, UploadFile, File, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from loguru import logger
from app.api.v1.endpoints import router as v1_router
from app.api.v1.review_endpoint import router as review_router
from app.services.document_processor import process_document_task

app = FastAPI(title="Trade Document AI Processor", version="1.0.0")

app.include_router(v1_router, prefix="/api/v1")
app.include_router(review_router, prefix="/api/v1")

# CORS configuration
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 👇 IMPORTANT
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_DIR = os.path.join(BASE_DIR, "api", "v1", "uploads")

app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

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