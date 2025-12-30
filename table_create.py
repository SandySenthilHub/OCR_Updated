import pandas as pd
from sqlalchemy import create_engine, text
import urllib

# ======================================================
# DATABASE CONFIG (MSSQL)
# ======================================================
DB_SERVER = "192.168.1.72"
DB_DATABASE = "trade"
DB_USER = "shahul"
DB_PASSWORD = "Apple123!@#"
DB_PORT = "1433"
DB_ENCRYPT = "no"
DB_TRUST_SERVER_CERTIFICATE = "yes"

# ======================================================
# FILE + TABLE CONFIG
# ======================================================
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
EXCEL_PATH = os.path.join(BASE_DIR, "data", "Format.xlsx")

TABLE_NAME = "OF_document_forms"   # Table name in MSSQL

# ======================================================
# CREATE CONNECTION STRING
# ======================================================
connection_string = (
    "DRIVER={ODBC Driver 17 for SQL Server};"
    f"SERVER={DB_SERVER},{DB_PORT};"
    f"DATABASE={DB_DATABASE};"
    f"UID={DB_USER};"
    f"PWD={DB_PASSWORD};"
    f"Encrypt={DB_ENCRYPT};"
    f"TrustServerCertificate={DB_TRUST_SERVER_CERTIFICATE};"
)

params = urllib.parse.quote_plus(connection_string)
engine = create_engine(f"mssql+pyodbc:///?odbc_connect={params}")

# ======================================================
# MAIN FUNCTION
# ======================================================
def load_excel_to_mssql():
    print("📄 Reading Excel file...")
    df = pd.read_excel(EXCEL_PATH)

    # Clean column names
    df.columns = (
        df.columns
        .str.strip()
        .str.lower()
        .str.replace(" ", "_")
        .str.replace("/", "_")
    )

    print("🗂 Columns detected:", list(df.columns))

    with engine.begin() as conn:
        print("🧹 Dropping table if exists...")
        conn.execute(text(f"""
        IF OBJECT_ID('{TABLE_NAME}', 'U') IS NOT NULL
            DROP TABLE {TABLE_NAME}
        """))

        print("🏗 Creating table...")
        column_definitions = ",\n".join(
            f"[{col}] NVARCHAR(MAX)" for col in df.columns
        )

        create_table_sql = f"""
        CREATE TABLE {TABLE_NAME} (
            id INT IDENTITY(1,1) PRIMARY KEY,
            {column_definitions}
        )
        """

        conn.execute(text(create_table_sql))

        print("📥 Inserting data...")
        df.to_sql(TABLE_NAME, conn, if_exists="append", index=False)

    print("✅ SUCCESS: Excel loaded into MSSQL table")

# ======================================================
# RUN
# ======================================================
if __name__ == "__main__":
    load_excel_to_mssql()
