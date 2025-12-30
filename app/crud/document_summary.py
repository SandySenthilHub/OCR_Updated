from app.database import get_connection

def insert_document_summary(
    case_id,
    doc_id,
    file_path,
    document_name,
    product,
    document_list,
    documents_json,
    approved_version,
    approved_by
):
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "{CALL sp_insert_document_summary (?, ?, ?, ?, ?, ?, ?, ?, ?)}",
            (
                case_id,
                doc_id,
                file_path,
                document_name,
                product,
                document_list,
                documents_json,
                approved_version,
                approved_by
            )
        )
        conn.commit()
