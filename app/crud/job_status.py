from app.database import get_connection

def create_job(doc_id, case_id, file_path):
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "{CALL sp_create_job (?, ?, ?)}",
            (doc_id, case_id, file_path)
        )
        conn.commit()

def update_job_status(doc_id, status, error_message=None):
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "{CALL sp_update_job_status (?, ?, ?)}",
            (doc_id, status, error_message)
        )
        conn.commit()
