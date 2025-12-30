# app/config.py
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseSettings):
    # -------------------------------
    # Azure AI Configuration
    # -------------------------------
    AZURE_DOC_ENDPOINT: str
    AZURE_DOC_KEY: str

    AZURE_OPENAI_ENDPOINT: str
    AZURE_OPENAI_KEY: str
    AZURE_DEPLOYMENT_NAME: str = "gpt-4o"

    # -------------------------------
    # Database Configuration (MSSQL)
    # -------------------------------
    DB_SERVER: str
    DB_DATABASE: str
    DB_USER: str
    DB_PASSWORD: str
    DB_PORT: int = 1433
    DB_ENCRYPT: str = "no"
    DB_TRUST_SERVER_CERTIFICATE: str = "yes"

    model_config = {
        "env_file": ".env",
        "case_sensitive": False
    }

settings = Settings()
