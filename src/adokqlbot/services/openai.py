from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
import logging
from openai import AsyncAzureOpenAI

from .settings import Settings

logger = logging.getLogger(__name__)


class Message(BaseModel):
    role: str
    content: str


class ChatCompletionRequest(BaseModel):
    messages: List[Message]
    temperature: float = 0.1
    max_tokens: Optional[int] = None
    top_p: float = 1.0
    frequency_penalty: float = 0.0
    presence_penalty: float = 0.0
    stop: Optional[List[str]] = None


class ChatCompletionResponse(BaseModel):
    content: str


settings = Settings()

# Singleton OpenAI client


class OpenAIClientSingleton:
    _instance = None

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = AsyncAzureOpenAI(
                api_key=settings.azure_openai_api_key,
                api_version=settings.azure_openai_version,
                azure_endpoint=settings.azure_openai_endpoint
            )
        return cls._instance


async def chat_completion(request: ChatCompletionRequest) -> ChatCompletionResponse:
    """
    Send a completion request to Azure OpenAI.

    Args:
        request: The chat completion request.

    Returns:
        The completion text.
    """

    try:
        # Convert Pydantic Message objects to dictionaries
        messages = [{"role": msg.role, "content": msg.content}
                    for msg in request.messages]

        response = await OpenAIClientSingleton.get_instance().chat.completions.create(
            model=settings.model or "gpt-4o",
            messages=messages,
            temperature=request.temperature,
            max_tokens=request.max_tokens,
            top_p=request.top_p,
            frequency_penalty=request.frequency_penalty,
            presence_penalty=request.presence_penalty,
            stop=request.stop
        )

        # Return the first choice's message content
        if response.choices:
            return ChatCompletionResponse(content=response.choices[0].message.content)
        return ChatCompletionResponse(content="")

    except Exception as e:
        logger.error(f"An error occurred: {e}")
        raise
