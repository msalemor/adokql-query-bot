from html import unescape
import os
import re
from typing import Any, Dict, List, Optional
from msrest.authentication import BasicAuthentication
from azure.devops.connection import Connection
from azure.devops.v7_1.work_item_tracking.models import Wiql

from dotenv import load_dotenv
from pydantic import BaseModel

from .common import UIColumn

# Load environment variables
load_dotenv()


class WiqlQueryRequest(BaseModel):
    organization: str
    query: str
    # Optional if provided via environment variable
    pat_token: Optional[str] = None


class QueryColumn(BaseModel):
    name: str
    reference_name: str


class QueryResult(BaseModel):
    columns: List[UIColumn]
    rows: List[Dict[str, Any]]


def remove_html_tags(text: str) -> str:
    clean = re.compile('<.*?>')
    return re.sub(clean, '', text)


def get_connection(organization: str, pat_token: Optional[str] = None) -> tuple[Connection, str]:
    # Use PAT token from request or from environment variable
    token = pat_token or os.getenv("AZURE_DEVOPS_PAT")
    if not token:
        return None, "No PAT token provided and no environment variable set."

    # Create a connection to Azure DevOps
    credentials = BasicAuthentication('', token)
    return (Connection(base_url=f"https://dev.azure.com/{organization}", creds=credentials), "")


def execute_query(connection: Connection, query: str) -> QueryResult:
    # Get the work item tracking client
    wit_client = connection.clients.get_work_item_tracking_client()

    # Create WIQL object
    wiql = Wiql(query=query)

    # Execute the query
    query_result = wit_client.query_by_wiql(wiql)

    # Extract columns
    columns = [
        UIColumn(
            field=column.name,
            width=150,
            # reference_name=column.reference_name
        )
        for column in query_result.columns
    ]

    # Process work items
    rows = []
    for work_item_ref in query_result.work_items:
        # Get the full work item to access field values
        work_item = wit_client.get_work_item(work_item_ref.id)

        # Create a row with all fields
        row = {}
        for column in query_result.columns:
            # The reference name is the field key in the work item's fields
            field_ref_name = column.reference_name
            if field_ref_name == "System.Id":
                row[column.name] = work_item.id
            elif field_ref_name == "System.AssignedTo":
                row[column.name] = work_item.fields.get(
                    field_ref_name, {}).get("displayName", None)
            elif field_ref_name in work_item.fields:
                row[column.name] = work_item.fields[field_ref_name]
                if row[column.name] and column.name == "Description":
                    # Unescape HTML entities
                    row[column.name] = unescape(
                        remove_html_tags(str(row[column.name])))
            else:
                row[column.name] = None

        rows.append(row)

    return QueryResult(
        columns=columns,
        rows=rows
    )
