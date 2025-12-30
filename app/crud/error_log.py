from app.database import get_connection
import traceback

def write_error_log(case_id, doc_id, step, error):
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "{CALL sp_write_error_log (?, ?, ?, ?, ?)}",
            (case_id, doc_id, step, str(error), traceback.format_exc())
        )
        conn.commit()
