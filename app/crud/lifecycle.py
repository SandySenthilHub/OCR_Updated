from app.database import get_connection
from loguru import logger


def get_all_lifecycles():
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT 
            Code,
            Instrument,
            Transition,
            Applicable_Documents,
            SWIFT_Messages,
            ID,
            Required_Documents
        FROM Life_cycle
    """)

    columns = [col[0] for col in cursor.description]
    rows = cursor.fetchall()

    cursor.close()
    conn.close()

    return [dict(zip(columns, row)) for row in rows]


def add_documents_to_lifecycle(lifecycle_id: int, required_documents: list[str]):
    conn = get_connection()
    cursor = conn.cursor()

    # Fetch existing docs
    cursor.execute(
        "SELECT ISNULL(Required_Documents, '') FROM Life_cycle WHERE ID = ?",
        lifecycle_id
    )
    row = cursor.fetchone()

    if not row:
        raise ValueError("Lifecycle not found")

    existing_docs = [
        d.strip() for d in row[0].split(",") if d.strip()
    ]

    for doc in required_documents:
        if doc.strip() not in existing_docs:
            existing_docs.append(doc.strip())

    cursor.execute(
        "UPDATE Life_cycle SET Required_Documents = ? WHERE ID = ?",
        ", ".join(existing_docs),
        lifecycle_id
    )

    conn.commit()
    cursor.close()
    conn.close()

    return existing_docs


def delete_document_from_lifecycle(lifecycle_id: int, document_name: str):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        "SELECT Required_Documents FROM Life_cycle WHERE ID = ?",
        lifecycle_id
    )
    row = cursor.fetchone()

    if not row:
        raise ValueError("Lifecycle not found")

    current_docs = (
        [d.strip() for d in row[0].split(",")]
        if row[0] else []
    )

    updated_docs = [
        d for d in current_docs
        if d.lower() != document_name.strip().lower()
    ]

    cursor.execute(
        "UPDATE Life_cycle SET Required_Documents = ? WHERE ID = ?",
        ", ".join(updated_docs),
        lifecycle_id
    )

    conn.commit()
    cursor.close()
    conn.close()

    return updated_docs
