from app.database import get_connection

def insert_classification(
    case_id, doc_id, file_path, page_no,
    code, name, extracted_text, is_external
):
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "{CALL sp_insert_classification (?, ?, ?, ?, ?, ?, ?, ?)}",
            (case_id, doc_id, file_path, page_no,
             code, name, extracted_text, int(is_external))
        )
        conn.commit()
