from app.database import get_connection

def create_draft(session_id,case_id, doc_id, document_name, file_path):
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "{CALL sp_create_draft (?,?, ?, ?, ?)}",
            (session_id,case_id, doc_id, document_name, file_path)
        )
        conn.commit()
def get_drafts_by_session(session_id: str):
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT
                doc_id,
                session_id,
                document_name,
                file_path,
                processed_at
            FROM OF_draft
            WHERE session_id = ?
            ORDER BY processed_at DESC
        """, (session_id,))

        columns = [column[0] for column in cursor.description]
        rows = cursor.fetchall()
        return [dict(zip(columns, row)) for row in rows]


def get_ocr_by_draft_id(doc_id: str):
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT doc_id, page_no, extracted_text, signature_stamp
            FROM OF_ocr
            WHERE doc_id = ?
        """, (doc_id,))
        columns = [column[0] for column in cursor.description]
        rows = cursor.fetchall()
        return [dict(zip(columns, row)) for row in rows]


def get_classification_by_draft_id(doc_id: str):
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT
                doc_id,
                file_path,
                page_no,
                classified_code,
                classified_name,
                extracted_text,
                is_external
            FROM OF_classification
            WHERE doc_id = ?
            ORDER BY page_no ASC
        """, (doc_id,))
        columns = [column[0] for column in cursor.description]
        rows = cursor.fetchall()
        return [dict(zip(columns, row)) for row in rows]


def get_final_ocr_by_draft_id(doc_id: str):
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT
                doc_id,
                file_path,
                whole_text,
                documents_json,
                processed_at
            FROM OF_final_ocr
            WHERE doc_id = ?
            ORDER BY processed_at ASC
        """, (doc_id,))
        columns = [column[0] for column in cursor.description]
        rows = cursor.fetchall()
        return [dict(zip(columns, row)) for row in rows]


def get_summary_by_draft_id(doc_id: str):
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT *
            FROM OF_document_summary
            WHERE doc_id = ?
        """, (doc_id,))
        columns = [column[0] for column in cursor.description]
        row = cursor.fetchone()
        return dict(zip(columns, row)) if row else None
