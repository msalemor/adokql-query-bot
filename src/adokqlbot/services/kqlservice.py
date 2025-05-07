from typing import List, Dict, Any
from pydantic import BaseModel
from azure.identity import DefaultAzureCredential
from azure.kusto.data import KustoClient, KustoConnectionStringBuilder
from azure.kusto.data.helpers import dataframe_from_result_table

from .adoservice import QueryResult
from .common import UIColumn

# Define the Pydantic model


class KQLResult(BaseModel):
    name: str
    columns: List[str]
    rows: List[Dict[str, Any]]


class Tables(BaseModel):
    results: List[KQLResult]


class KQLDBRequest(BaseModel):
    cluster: str


class KQLDBResponse(BaseModel):
    databases: List[str]

# Function to execute KQL query and return results using Pydantic objects


def get_client(cluster: str) -> KustoClient:
    kcsb = KustoConnectionStringBuilder.with_az_cli_authentication(cluster)
    return KustoClient(kcsb)


def list_databases(cluster: str) -> KQLDBResponse:
    # Authenticate using Azure credentials
    # kcsb = KustoConnectionStringBuilder.with_az_cli_authentication(cluster)
    client = get_client(cluster=cluster)

    # Query to list databases
    query = ".show databases"

    # Execute the query
    response = client.execute("NetDefaultDB", query)

    # Extract database names
    databases = [row["DatabaseName"] for row in response.primary_results[0]]
    databases.sort()

    return KQLDBResponse(databases=databases)


def execute_kql(cluster: str, database: str, query: str) -> QueryResult:
    # Authenticate using Azure credentials
    client = get_client(cluster=cluster)

    # Execute KQL query
    response = client.execute(database, query)

    # Extract columns and rows
    # table_count = len(response.primary_results)
    # tables = Tables(results=[])
    # for i in range(table_count):
    #     columns = [col.column_name for col in response.primary_results[i].columns]
    #     rows = [dict(zip(columns, row.to_list()))
    #             for row in response.primary_results[i]]
    #     tables.results.append(
    #         KQLResult(name=f"Table {i+1}", columns=columns, rows=rows))

    if len(response.primary_results) > 0:
        columns = [col.column_name for col in response.primary_results[0].columns]
        UIcolumns = [UIColumn(field=col.column_name, width=150)
                     for col in response.primary_results[0].columns]
        rows = [dict(zip(columns, row.to_list()))
                for row in response.primary_results[0]]
        return QueryResult(columns=UIcolumns, rows=rows)
    else:
        return QueryResult(columns=[], rows=[])
