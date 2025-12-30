import os
import re
import json
from PyPDF2 import PdfReader
from pdf2image import convert_from_path
from pytesseract import image_to_string
from PIL import Image
from extract_fields import extract_fields
from db_utils import (
    save_cleaned_text_to_db,
    save_extracted_fields_to_db,
    save_cleaned_pdf_to_db,
    get_sql_server_connection,
)
from azure.ai.documentintelligence import DocumentIntelligenceClient
from azure.core.credentials import AzureKeyCredential
from openai import AzureOpenAI
from dotenv import load_dotenv
import argparse
from pathlib import Path
from difflib import SequenceMatcher
from datetime import datetime
import pyodbc

# -------------------------------
# Load environment variables
# -------------------------------
load_dotenv()
key_doc = os.getenv("AZURE_DOC_KEY")
endpoint_doc = os.getenv("AZURE_DOC_ENDPOINT")
credential_doc = AzureKeyCredential(key_doc)
client_doc = DocumentIntelligenceClient(endpoint_doc, credential_doc)

client_openai = AzureOpenAI(
    api_key=os.getenv("AZURE_OPENAI_KEY"),
    api_version="2024-12-01-preview",
    azure_endpoint=os.getenv("AZURE_OPENAI_ENDPOINT"),
)

# -------------------------------
# Text extraction helpers
# -------------------------------
def extract_text_from_pdf(pdf_path: str) -> str:
    reader = PdfReader(pdf_path)
    full_text = ""
    for page in reader.pages:
        text = page.extract_text() or ""
        full_text += text + "\n"
    return full_text.strip()

def extract_text_from_image(image: Image.Image) -> str:
    return image_to_string(image).strip()

def extract_text_azure_document(pdf_path: str) -> str:
    with open(pdf_path, "rb") as f:
        poller = client_doc.begin_analyze_document("prebuilt-layout", f)
    result = poller.result()
    pages_text = []
    for page in result.pages:
        lines = [line.content for line in page.lines]
        pages_text.append("\n".join(lines))
    return "\n".join(pages_text)

def extract_text_fallback(pdf_path: str, method: str = "tesseract") -> str:
    print(" PDF text is empty, running fallback OCR...")
    images = convert_from_path(pdf_path)
    full_text = ""

    if method.lower() == "azure":
        try:
            full_text = extract_text_azure_document(pdf_path)
            if full_text.strip():
                return full_text
        except Exception as e:
            print(f" Azure OCR failed: {e}")

    for image in images:
        page_text = extract_text_from_image(image)
        if page_text.strip():
            full_text += page_text + "\n\n"
    return full_text.strip()

# -------------------------------
# Goods extraction and comparison
# -------------------------------
def extract_goods_description(full_text: str) -> str:
    """Extract the 'Description of Goods and/or Services' section (e.g., field 45A in MT700)."""
    match = re.search(r"45A:\s*(.*?)(?:\n\d{2}[A-Z]:|$)", full_text, re.DOTALL)
    if match:
        goods_text = match.group(1)
        goods_text = re.sub(r"\s+", " ", goods_text).strip()
        return goods_text
    return "[NO GOODS DESCRIPTION FOUND]"

def fetch_control_items(conn):
    """Fetch control list items from SQL Server table."""
    query = "SELECT ItemID, SourceList, ControlCode, Description FROM ControlItems"
    cursor = conn.cursor()
    cursor.execute(query)
    rows = cursor.fetchall()
    columns = [col[0] for col in cursor.description]
    return [dict(zip(columns, row)) for row in rows]

def find_best_match(extracted_text: str, control_items: list, threshold: float = 0.5):
    """Find the best matching controlled item."""
    best_match = None
    best_score = 0.0
    for item in control_items:
        desc = item["Description"]
        ratio = SequenceMatcher(None, extracted_text.lower(), desc.lower()).ratio()
        if ratio > best_score:
            best_score = ratio
            best_match = item
    is_controlled = 1 if best_score >= threshold else 0
    return {
        "IsControlled": is_controlled,
        "MatchItem": best_match["Description"] if best_match else None,
        "MatchScore": round(best_score, 2),
        "ControlCode": best_match["ControlCode"] if best_match else None
    }

def save_goods_result_to_db(conn, session_id, document_id, goods_text, match_info):
    """Save presented goods and comparison result to SQL Server."""
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO GoodsScreeningResults
        (SessionID, DocumentID, GoodsDescription, IsControlled, MatchItem, MatchScore, CreatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (
        session_id,
        document_id,
        goods_text,
        match_info["IsControlled"],
        match_info["MatchItem"],
        match_info["MatchScore"],
        datetime.now()
    ))
    conn.commit()

# -------------------------------
# Main processing function
# -------------------------------
def process_pdf(pdf_path: str, session_id: str, document_id: str, ocr_method: str = "tesseract"):
    conn = get_sql_server_connection()
    print(f" Processing PDF: {pdf_path}")

    # Save PDF
    save_cleaned_pdf_to_db(conn, session_id, document_id, "full_document", pdf_path)
    print(" PDF saved to database.")

    # Save locally
    output_dir = Path("outputs") / session_id
    output_dir.mkdir(parents=True, exist_ok=True)
    local_pdf_path = output_dir / f"{document_id}.pdf"
    with open(pdf_path, "rb") as src_file, open(local_pdf_path, "wb") as dst_file:
        dst_file.write(src_file.read())
    print(f" PDF saved locally at: {local_pdf_path}")

    # Extract text
    full_text = extract_text_from_pdf(pdf_path)
    if not full_text.strip():
        full_text = extract_text_fallback(pdf_path, method=ocr_method)
    if not full_text.strip():
        full_text = "[NO TEXT FOUND]"

    # Extract structured fields
    fields = extract_fields(full_text)

    # Save OCR and fields
    save_cleaned_text_to_db(conn, session_id, document_id, "full_document", full_text)
    save_extracted_fields_to_db(conn, session_id, document_id, "full_document", fields)
    print(" OCR and field extraction completed successfully.")

    # -------------------------------
    # Check if document contains goods info
    # -------------------------------
    if not re.search(r"45A:", full_text, re.IGNORECASE) and not re.search(r"description\s+of\s+goods", full_text, re.IGNORECASE):
        print(" No goods details found in this document. Skipping comparison.")
        conn.close()
        return

    # -------------------------------
    # Goods description extraction
    # -------------------------------
    goods_text = extract_goods_description(full_text)
    if goods_text == "[NO GOODS DESCRIPTION FOUND]":
        print(" Could not detect goods section, using full text for comparison.")
        goods_text = full_text
    else:
        print(f" Extracted goods description: {goods_text[:150]}...")

    # Fetch control items
    print(" Fetching control list from SQL Server...")
    control_items = fetch_control_items(conn)

    # Compare goods with control list
    print(" Comparing goods description with control items...")
    match_info = find_best_match(goods_text, control_items, threshold=0.55)

    # Save result
    save_goods_result_to_db(conn, session_id, document_id, goods_text, match_info)

    # Display console summary
    if match_info["IsControlled"]:
        print("\n Controlled goods detected:")
        print(f" - Control Code: {match_info['ControlCode']}")
        print(f" - Match Description: {match_info['MatchItem'][:100]}...")
        print(f" - Match Score: {match_info['MatchScore']}")
    else:
        print(" No controlled goods found.")

    print(" Goods screening result saved to DB successfully.")
    conn.close()

# -------------------------------
# Command-line interface
# -------------------------------
if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="OCR and extract fields from PDF")
    parser.add_argument("pdf_path")
    parser.add_argument("session_id")
    parser.add_argument("document_id")
    parser.add_argument("ocr_method", nargs="?", default="azure")
    args = parser.parse_args()

    process_pdf(args.pdf_path, args.session_id, args.document_id, args.ocr_method)
