import os
from dotenv import load_dotenv


class Settings:
    """
    Singleton class to manage application settings.
    """
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(Settings, cls).__new__(cls)
            cls._instance._initialize()
        return cls._instance

    def _initialize(self):
        """Load settings from .env file and environment variables"""
        load_dotenv()

        # Load settings into private variables
        self._azure_openai_endpoint = os.getenv("AZURE_OPENAI_ENDPOINT")
        self._azure_openai_api_key = os.getenv("AZURE_OPENAI_API_KEY")
        self._azure_openai_version = os.getenv(
            "AZURE_OPENAI_VERSION", "2023-05-15")
        self._model = os.getenv("AZURE_OPENAI_MODEL", "gpt-4o")
        self._ado_organization = os.getenv("ADO_ORGANIZATION")
        self._ado_pat_token = os.getenv("ADO_PAT_TOKEN")
        self._default_kql_cluster = os.getenv("DEFAULT_KQL_CLUSTER")

    @property
    def azure_openai_endpoint(self):
        return self._azure_openai_endpoint

    @property
    def azure_openai_api_key(self):
        return self._azure_openai_api_key

    @property
    def azure_openai_version(self):
        return self._azure_openai_version

    @property
    def model(self):
        return self._model

    @property
    def ado_organization(self):
        return self._ado_organization

    @property
    def ado_pat_token(self):
        return self._ado_pat_token

    @property
    def default_kql_cluster(self):
        return self._default_kql_cluster
