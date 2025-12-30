import sys
from app.services.document_processor import process_document_task

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python scripts/process_single.py <path_to_pdf>")
        sys.exit(1)
    pdf_path = sys.argv[1]
    process_document_task(pdf_path, os.path.basename(pdf_path))