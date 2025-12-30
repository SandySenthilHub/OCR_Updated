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
