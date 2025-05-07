from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from .services.openai import ChatCompletionRequest, ChatCompletionResponse, chat_completion
from .services.kqlservice import KQLDBRequest, KQLDBResponse, execute_kql, list_databases
from .services.adoservice import QueryResult, WiqlQueryRequest, execute_query, get_connection

app = FastAPI(title="Azure DevOps Insights API")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)


@app.post("/api/ado", response_model=QueryResult)
async def execute_wiql(request: WiqlQueryRequest):
    try:
        # Create connection
        (connection, err) = get_connection(
            request.organization, request.pat_token)
        if err:
            raise HTTPException(
                status_code=400, detail=f"{err}")

        return execute_query(connection, request.query)

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error executing WIQL query: {str(e)}")


class KQLRequest(BaseModel):
    cluster: str
    database: str
    query: str


@app.post("/api/kql", response_model=QueryResult)
async def execute_wiql(request: KQLRequest):
    try:
        return execute_kql(request.cluster, request.database, request.query)
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error KQL query: {str(e)}")


@app.post("/api/kqldb", response_model=KQLDBResponse)
async def execute_wiql(request: KQLDBRequest):
    try:
        return list_databases(request.cluster)
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error KQL query: {str(e)}")


@app.post("/api/completion", response_model=ChatCompletionResponse)
async def get_completion(request: ChatCompletionRequest):
    try:
        return await chat_completion(request)
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error KQL query: {str(e)}")


app.mount("/", StaticFiles(directory="static", html=True), name="ui")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
