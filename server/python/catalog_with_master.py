import os
import difflib
import uuid
from db_utils import get_sql_server_connection


def get_master_documents(conn):
    """Fetch all documents from MasterDocuments and TF_SubDocuments tables."""
    cursor = conn.cursor()

    # Fetch from MasterDocuments
    cursor.execute("SELECT DocumentID, DocumentName FROM MasterDocuments WHERE IsActive = 1")
    master_rows = cursor.fetchall()

    # Fetch from TF_SubDocuments
    cursor.execute("SELECT SubDocumentID AS DocumentID, SubDocumentName AS DocumentName FROM TF_SubDocuments WHERE IsActive = 1")
    sub_rows = cursor.fetchall()

    # Combine both
    all_docs = []
    columns = ["DocumentID", "DocumentName"]

    for row in master_rows:
        all_docs.append(dict(zip(columns, row)))

    for row in sub_rows:
        all_docs.append(dict(zip(columns, row)))

    return all_docs


def folder_name_to_readable(name: str) -> str:
    """Convert folder names like 'bill_of_lading' to 'Bill Of Lading'."""
    return name.replace("_", " ").strip().title()


def read_grouped_text(folder_path):
    """Read first .txt file content inside the folder (e.g., text.txt)."""
    for file in os.listdir(folder_path):
        if file.endswith(".txt"):
            with open(os.path.join(folder_path, file), "r", encoding="utf-8") as f:
                return f.read().strip()
    return ""


def catalog_grouped_text(conn, session_id, document_id, folder_name, text_content):
    """Match grouped form folder with master/sub documents and insert catalog record."""
    master_docs = get_master_documents(conn)

    folder_name_clean = folder_name.replace("_", " ").lower()

    best_match_name = None
    best_match_id = None
    best_score = 0.0

    for doc in master_docs:
        master_name = doc.get("DocumentName", "").lower()
        score = difflib.SequenceMatcher(None, folder_name_clean, master_name).ratio()

        if score > best_score:
            best_score = score
            best_match_name = doc.get("DocumentName")
            best_match_id = doc.get("DocumentID")

    if best_score < 0.3:
        best_match_name = None
        best_match_id = None

    # UUID-safe conversion helper
    def safe_uuid(value):
        try:
            return uuid.UUID(str(value))
        except (ValueError, TypeError, AttributeError):
            return None

    session_uuid = safe_uuid(session_id)
    document_uuid = safe_uuid(document_id)
    matched_uuid = safe_uuid(best_match_id)

    query = """
        INSERT INTO TF_mdocs_mgroups (
            session_id, document_id, grouped_form_type,
            matched_document_name, matched_document_id,
            confidence_score, cataloged_at
        )
        VALUES (?, ?, ?, ?, ?, ?, GETDATE())
    """
    cursor = conn.cursor()
    cursor.execute(query, (
        session_uuid,
        document_uuid,
        folder_name,
        best_match_name,
        matched_uuid,
        best_score
    ))
    conn.commit()

    print(f"[ Cataloged] '{folder_name}' -> '{best_match_name}' (score: {round(best_score, 2)})")


def catalog_all_grouped_documents(session_id, document_id):
    """Catalog all grouped folders for a session/document pair."""
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
    grouped_path = os.path.join(base_dir, "grouped", str(session_id), str(document_id))

    if not os.path.exists(grouped_path):
        print(f"Grouped folder not found: {grouped_path}")
        return

    folders = [
        f for f in os.listdir(grouped_path)
        if os.path.isdir(os.path.join(grouped_path, f))
    ]

    print(f"[Catalog Success]: Found {len(folders)} grouped folders")

    conn = get_sql_server_connection()
    for folder in folders:
        content = read_grouped_text(os.path.join(grouped_path, folder))
        catalog_grouped_text(conn, session_id, document_id, folder, content)
    conn.close()


if __name__ == "__main__":
    import sys
    if len(sys.argv) != 3:
        print("Usage: python catalog_with_master.py <session_id> <document_id>")
    else:
        try:
            session_id = uuid.UUID(sys.argv[1])
            document_id = uuid.UUID(sys.argv[2])
        except ValueError:
            print("Invalid UUIDs")
            sys.exit(1)

        catalog_all_grouped_documents(session_id, document_id)
