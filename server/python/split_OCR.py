import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

import os
import re
import json
import pyodbc
import argparse
from PyPDF2 import PdfReader, PdfWriter
from collections import defaultdict
from pdf2image import convert_from_path
from pytesseract import image_to_string
from PIL import Image
from typing import List, Dict
from datetime import datetime
from pathlib import Path
from dotenv import load_dotenv
from difflib import SequenceMatcher
from extract_fields import extract_fields
from db_utils import (
    save_cleaned_text_to_db,
    save_cleaned_pdf_to_db,
    save_extracted_fields_to_db,
    get_sql_server_connection
)

# Azure OCR & OpenAI
from azure.ai.documentintelligence import DocumentIntelligenceClient
from azure.core.credentials import AzureKeyCredential
from openai import AzureOpenAI
import base64
from io import BytesIO

# -------------------------------
# Load credentials
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

azure_page_text_cache = []

# -------------------------------
# Helper: Sanitize form name
# -------------------------------
def sanitize_form_name(name: str) -> str:
    name = name.upper().strip()
    name = re.sub(r"[^A-Z0-9 ]", "", name)
    name = re.sub(r"\s+", "_", name)
    return name[:50]

# -------------------------------
# OCR Helpers
# -------------------------------
def extract_text_from_image_with_rotation(image: Image.Image) -> str:
    max_text = ""
    max_len = 0
    for angle in [0, 90, 180, 270]:
        rotated = image.rotate(angle, expand=True)
        gray = rotated.convert("L")
        text = image_to_string(gray).strip()
        if len(text) > max_len:
            max_text = text
            max_len = len(text)
    return max_text

def extract_text_azure_document(pdf_path):
    global azure_page_text_cache
    if azure_page_text_cache:
        return azure_page_text_cache
    with open(pdf_path, "rb") as f:
        poller = client_doc.begin_analyze_document("prebuilt-layout", f)
    result = poller.result()
    for page in result.pages:
        lines = [line.content for line in page.lines]
        azure_page_text_cache.append("\n".join(lines))
    return azure_page_text_cache

def encode_image_to_base64(image: Image.Image) -> str:
    buffer = BytesIO()
    image.save(buffer, format="JPEG")
    return base64.b64encode(buffer.getvalue()).decode("utf-8")

def refine_text_with_azure_openai_image(image: Image.Image) -> str:
    try:
        base64_image = encode_image_to_base64(image)
        image_data = f"data:image/jpeg;base64,{base64_image}"
        deployment = os.getenv("AZURE_DEPLOYMENT_NAME", "gpt-4o")

        response = client_openai.chat.completions.create(
            model=deployment,
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": (
                                "You are an OCR/ICR agent who will extract the text "
                                "in any language from the image, including lines, tables, "
                                "stamps, seals, and numbers in currencies. Keep them as they are "
                                "and identify them clearly. DO NOT TRANSLATE. "
                                "Return the exact text in the same format."
                            ),
                        },
                        {"type": "image_url", "image_url": {"url": image_data}},
                    ],
                }
            ],
            max_tokens=4096,
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        print(f"Azure OpenAI image OCR failed: {e}")
        return None

def extract_text_multi_ocr(image: Image.Image, pdf_path: str, page_index: int) -> Dict[str, str]:
    ocr_source = None  # track which one worked finally

    # --- 1️⃣ Tesseract ---
    tesseract_text = extract_text_from_image_with_rotation(image)

    # --- 2️⃣ Azure Document Intelligence ---
    azure_doc_text = ""
    try:
        azure_texts = extract_text_azure_document(pdf_path)
        azure_doc_text = azure_texts[page_index] if page_index < len(azure_texts) else ""
    except Exception as e:
        print(f"Azure Document Intelligence failed: {e}")

    # --- 3️⃣ Azure OpenAI Vision ---
    openai_cleaned = None
    try:
        openai_cleaned = refine_text_with_azure_openai_image(image)
    except Exception as e:
        print(f"Azure OpenAI Vision failed: {e}")

    # --- Decide which one succeeded ---
    final_text = None
    if openai_cleaned and len(openai_cleaned.strip()) > 10:
        final_text = openai_cleaned
        ocr_source = "Azure OpenAI Vision"
    elif azure_doc_text and len(azure_doc_text.strip()) > 10:
        final_text = azure_doc_text
        ocr_source = "Azure Document Intelligence"
    elif tesseract_text and len(tesseract_text.strip()) > 10:
        final_text = tesseract_text
        ocr_source = "Tesseract OCR"
    else:
        final_text = "[NO TEXT FOUND]"
        ocr_source = "None"

    # --- Log the fallback result clearly ---
    print(f"🧠 OCR used for page {page_index + 1}: {ocr_source}")

    return {
        "tesseract": tesseract_text,
        "azure_doc_intelligence": azure_doc_text,
        "azure_openai": openai_cleaned,
        "final_text": final_text,
        "ocr_source": ocr_source,
    }

# -------------------------------
# Goods Screening Helpers
# -------------------------------
def extract_goods_description(full_text: str) -> str:
    match = re.search(r"45A:\s*(.*?)(?:\n\d{2}[A-Z]:|$)", full_text, re.DOTALL)
    if match:
        goods_text = re.sub(r"\s+", " ", match.group(1)).strip()
        return goods_text
    return "[NO GOODS DESCRIPTION FOUND]"

def fetch_control_items(conn):
    query = "SELECT ItemID, SourceList, ControlCode, Description FROM ControlItems"
    cursor = conn.cursor()
    cursor.execute(query)
    rows = cursor.fetchall()
    columns = [col[0] for col in cursor.description]
    return [dict(zip(columns, row)) for row in rows]

def find_best_match(extracted_text: str, control_items: list, threshold: float = 0.55):
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
        "ControlCode": best_match["ControlCode"] if best_match else None,
    }

def save_goods_result_to_db(conn, session_id, document_id, goods_text, match_info):
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
# Main Split Logic
# -------------------------------
def split_pdf_by_form_type(pdf_path: str, session_id: str, document_id: str, conn, output_base: str = "./outputs", ocr_method: str = "tesseract"):
    original_filename = os.path.basename(pdf_path)
    base_name = os.path.splitext(original_filename)[0]
    output_dir = os.path.join(output_base, session_id, f"{base_name}-{document_id}")
    os.makedirs(output_dir, exist_ok=True)

    original_copy_path = os.path.join(output_dir, "original.pdf")
    with open(original_copy_path, "wb") as f_out:
        reader = PdfReader(pdf_path)
        writer = PdfWriter()
        for page in reader.pages:
            writer.add_page(page)
        writer.write(f_out)

    print(f"Converting all PDF pages to images...")
    images = convert_from_path(pdf_path)

    all_goods_texts = []  # Collect goods text across pages

    for i, image in enumerate(images):
        page_number = i + 1
        padded_page = f"{page_number:02}"
        print(f"\nProcessing Page {page_number}...")

        pdf_path_out = os.path.join(output_dir, f"Page_{padded_page}.pdf")
        txt_path_out = os.path.join(output_dir, f"Page_{padded_page}.txt")
        json_path_out = os.path.join(output_dir, f"Page_{padded_page}.fields.json")

        writer = PdfWriter()
        reader = PdfReader(pdf_path)
        writer.add_page(reader.pages[i])
        with open(pdf_path_out, "wb") as f_pdf:
            writer.write(f_pdf)

        texts = extract_text_multi_ocr(image, pdf_path, i)
        final_text = texts["final_text"]
        print(f"✅ Final OCR source for Page {page_number}: {texts['ocr_source']}")
        if not final_text or len(final_text.strip()) < 10:
            final_text = "[NO TEXT FOUND]"

        with open(txt_path_out, "w", encoding="utf-8") as f_txt:
            f_txt.write(final_text)

        if final_text.strip() == "[NO TEXT FOUND]" or len(final_text.strip()) < 10:
            fields = {}
        else:
            fields = extract_fields(final_text.strip())

        with open(json_path_out, "w", encoding="utf-8") as f_json:
            json.dump(fields, f_json, indent=2, ensure_ascii=False)

        save_cleaned_pdf_to_db(conn, session_id, document_id, f"Page_{padded_page}", pdf_path_out)
        save_cleaned_text_to_db(conn, session_id, document_id, f"Page_{padded_page}", txt_path_out)
        save_extracted_fields_to_db(conn, session_id, document_id, f"Page_{padded_page}", fields)
        print(f"Page {page_number} processed and saved.")

        # -------------------------------
        # GOODS SCREENING COLLECTION
        # -------------------------------
        if re.search(r"45A:", final_text, re.IGNORECASE) or re.search(r"description\s+of\s+goods", final_text, re.IGNORECASE):
            print("Goods section detected on this page.")
            goods_text = extract_goods_description(final_text)
            if goods_text == "[NO GOODS DESCRIPTION FOUND]":
                goods_text = final_text
            all_goods_texts.append(goods_text)
        else:
            print("No goods section found on this page.")

    # -------------------------------
    # MERGE GOODS TEXTS AND SCREEN ONCE
    # -------------------------------
    if all_goods_texts:
        print("\nCombining all detected goods descriptions into one entry...")
        combined_goods = "\n--- PAGE SPLIT ---\n".join(all_goods_texts)
        combined_goods = re.sub(r"\s+", " ", combined_goods).strip()

        # Perform screening using the full combined goods text
        control_items = fetch_control_items(conn)
        match_info = find_best_match(combined_goods, control_items, threshold=0.55)

        # --- Create concise short description (first line or first 20 words) ---
        short_description = combined_goods.split("\n")[0]
        short_description = re.sub(r"\s+", " ", short_description).strip()
        if len(short_description.split()) > 20:
            short_description = " ".join(short_description.split()[:20]) + "..."

        # Save only the short description to DB
        save_goods_result_to_db(conn, session_id, document_id, short_description, match_info)

        if match_info["IsControlled"]:
            print(f"Controlled goods found → {match_info['MatchItem'][:100]} ({match_info['MatchScore']})")
        else:
            print("No controlled goods detected in the combined goods description.")
    else:
        print("\nNo goods description found in any page.")

    print(f"\nDone splitting and processing all {len(images)} pages for session: {session_id}")

# -------------------------------
# Main entry
# -------------------------------
if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Split documents by pages with OCR and goods screening")
    parser.add_argument("pdf_path")
    parser.add_argument("session_id")
    parser.add_argument("document_id")
    parser.add_argument("ocr_method")
    args = parser.parse_args()

    conn = get_sql_server_connection()
    split_pdf_by_form_type(args.pdf_path, args.session_id, args.document_id, conn, ocr_method=args.ocr_method)
