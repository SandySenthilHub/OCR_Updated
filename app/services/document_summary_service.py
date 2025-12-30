from app.database import get_connection
from app.crud.document_summary import insert_document_summary


def detect_product(document_codes: set) -> str:
    trade_docs = {
        "letter_of_credit", "bill_of_lading", "bill_of_exchange",
        "invoice", "packing_list", "certificate_of_origin",
        "air_waybill", "sea_way_bill"
    }

    insurance_docs = {
        "POL", "POLICY", "INS_POLICY", "INS_CERT",
        "CLAIM", "CLAIM_FORM", "ENDORSEMENT"
    }

    rfo_docs = {
        "KYC", "APPLICATION", "CONSENT", "UNDERTAKING"
    }

    if document_codes & trade_docs:
        return "Trade Finance"
    if document_codes & insurance_docs:
        return "Insurance"
    if document_codes & rfo_docs:
        return "RFO"
    return "Unknown"


def create_document_summary(doc_id: str):
    """
    Creates immutable document summary after approval.
    """

    with get_connection() as conn:
        cursor = conn.cursor()

        # 0️⃣ Prevent duplicate summary
        cursor.execute("""
            SELECT 1 FROM OF_document_summary WHERE doc_id = ?
        """, (doc_id,))
        if cursor.fetchone():
            return

        # 1️⃣ Job metadata
        cursor.execute("""
            SELECT case_id, file_path
            FROM OF_document_job_status
            WHERE doc_id = ?
        """, (doc_id,))
        case_id, file_path = cursor.fetchone()

        # 2️⃣ Document name
        cursor.execute("""
            SELECT document_name
            FROM OF_draft
            WHERE doc_id = ?
        """, (doc_id,))
        row = cursor.fetchone()
        document_name = row[0] if row else ""

        # 3️⃣ Classification → product & list
        cursor.execute("""
            SELECT DISTINCT classified_name
            FROM OF_classification
            WHERE doc_id = ? AND classified_name <> 'unknown'
        """, (doc_id,))
        document_names = {r[0].lower() for r in cursor.fetchall()}
        document_list = ",".join(sorted(document_names))
        product = detect_product(document_names)

        # 4️⃣ Approved OCR snapshot
        cursor.execute("""
            SELECT documents_json, version, last_edited_by
            FROM OF_final_ocr
            WHERE doc_id = ? AND status = 'APPROVED'
        """, (doc_id,))
        row = cursor.fetchone()

        if not row:
            raise RuntimeError("Document not approved yet")

        documents_json, approved_version, approved_by = row

    # 5️⃣ Insert final immutable summary
    insert_document_summary(
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