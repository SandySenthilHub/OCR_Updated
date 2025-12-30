# app/services/case_id_service.py
from app.database import get_connection
def generate_case_id(product: str) -> str:
    """
    Calls sp_generate_case_id and retrieves OUTPUT parameter safely.
    """
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            DECLARE @case_id VARCHAR(100);
            EXEC sp_generate_case_id ?, @case_id OUTPUT;
            SELECT @case_id;
        """, (product,))
        row = cursor.fetchone()
        if not row or not row[0]:
            raise RuntimeError("Failed to generate CASE ID")
        return row[0]