# app/crud/session.py

import os
from datetime import datetime
from pathlib import Path
from typing import Optional, List, Dict

from app.database import get_connection
from loguru import logger

def create_session(session_data: Dict):
    try:
        conn = get_connection()
        cursor = conn.cursor()

        USER_ID = "E9B0B018-B3DC-4737-8CE0-2D55D627868A"

        query = """
        INSERT INTO SB_TF_ingestion_Box
        (
            cifNumber,
            customerId,
            customerName,
            accountName,
            customerType,
            lcNumber,
            instrument,
            lifecycle,
            userId,
            status,
            createdAt,
            updatedAt,
            iterations
        )
        OUTPUT INSERTED.*
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
        """

        cursor.execute(
            query,
            session_data["cifNumber"],
            session_data["customerId"],
            session_data["customerName"],
            session_data["accountName"],
            session_data["customerType"],
            session_data["lcNumber"],
            session_data["instrument"],
            session_data["lifecycle"],
            USER_ID,
            "created",
            datetime.utcnow(),
            datetime.utcnow(),
        )

        row = cursor.fetchone()
        conn.commit()

        return dict(zip([c[0] for c in cursor.description], row))

    except Exception:
        logger.exception("Error creating session")
        raise
    finally:
        conn.close()



def get_all_sessions(user_id: Optional[str] = None) -> List[Dict]:
    try:
        conn = get_connection()
        cursor = conn.cursor()

        query = """
        SELECT
            *
        FROM SB_TF_ingestion_Box
        """

        params = []
        if user_id:
            query += " WHERE userId = ?"
            params.append(user_id)

        query += " ORDER BY createdAt DESC"

        cursor.execute(query, params)
        columns = [c[0] for c in cursor.description]

        return [dict(zip(columns, row)) for row in cursor.fetchall()]

    except Exception:
        logger.exception("Error fetching sessions")
        raise
    finally:
        conn.close()



def get_session_by_id(session_id: str) -> Optional[Dict]:
    try:
        conn = get_connection()
        cursor = conn.cursor()

        query = """
        SELECT *
        FROM SB_TF_ingestion_Box
        WHERE id = ?
        """

        cursor.execute(query, session_id)
        row = cursor.fetchone()

        if not row:
            return None

        return dict(zip([c[0] for c in cursor.description], row))

    except Exception:
        logger.exception("Error fetching session")
        raise
    finally:
        conn.close()


def update_session_status(session_id: str, status: str) -> Dict:
    try:
        conn = get_connection()
        cursor = conn.cursor()

        query = """
        UPDATE SB_TF_ingestion_Box
        SET status = ?, updatedAt = ?
        OUTPUT INSERTED.*
        WHERE id = ?
        """

        cursor.execute(query, status, datetime.utcnow(), session_id)
        row = cursor.fetchone()
        conn.commit()

        return dict(zip([c[0] for c in cursor.description], row))

    except Exception:
        logger.exception("Error updating session status")
        raise
    finally:
        conn.close()


def increment_iteration(session_id: str) -> Dict:
    try:
        conn = get_connection()
        cursor = conn.cursor()

        query = """
        UPDATE SB_TF_ingestion_Box
        SET iterations = iterations + 1,
            updatedAt = ?
        OUTPUT INSERTED.*
        WHERE id = ?
        """

        cursor.execute(query, datetime.utcnow(), session_id)
        row = cursor.fetchone()
        conn.commit()

        return dict(zip([c[0] for c in cursor.description], row))

    except Exception:
        logger.exception("Error incrementing iteration")
        raise
    finally:
        conn.close()


def delete_session(session_id: str) -> Dict:
    try:
        conn = get_connection()
        cursor = conn.cursor()

        session = get_session_by_id(session_id)
        if not session:
            raise ValueError("Session not found")

        cursor.execute(
            "DELETE FROM SB_TF_ingestion_Box WHERE id = ?",
            session_id
        )
        conn.commit()

        return {
            "success": True,
            "deletedSession": session
        }

    except Exception:
        logger.exception("Error deleting session")
        raise
    finally:
        conn.close()



def create_customer(customer_data: Dict):
    try:
        conn = get_connection()
        cursor = conn.cursor()

        query = """
        INSERT INTO OF_Customer_details
        (
            sessionId,
            cifNumber,
            customerId,
            customerName,
            accountName,
            customerType,
            lcNumber,
            instrument,
            lifecycle,
            createdAt,
            updatedAt
        )
        OUTPUT INSERTED.*
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """

        cursor.execute(
            query,
            customer_data["sessionId"],
            customer_data["cifNumber"],
            customer_data["customerId"],
            customer_data["customerName"],
            customer_data["accountName"],
            customer_data["customerType"],
            customer_data.get("lcNumber"),
            customer_data.get("instrument"),
            customer_data.get("lifecycle"),
            datetime.utcnow(),
            datetime.utcnow(),
        )

        row = cursor.fetchone()
        conn.commit()

        return dict(zip([c[0] for c in cursor.description], row))

    except Exception:
        logger.exception("Error creating customer")
        raise
    finally:
        conn.close()

def get_customer(cif_number: str | None = None, customer_id: str | None = None):
    try:
        conn = get_connection()
        cursor = conn.cursor()

        query = """
        SELECT TOP 1
            cifNumber,
            customerId,
            customerName,
            accountName,
            customerType
        FROM OF_Customer_details
        WHERE
            (cifNumber = ? AND ? IS NOT NULL)
            OR
            (customerId = ? AND ? IS NOT NULL)
        """

        cursor.execute(
            query,
            cif_number, cif_number,
            customer_id, customer_id
        )

        row = cursor.fetchone()
        if not row:
            return None

        columns = [c[0] for c in cursor.description]
        return dict(zip(columns, row))

    finally:
        conn.close()
