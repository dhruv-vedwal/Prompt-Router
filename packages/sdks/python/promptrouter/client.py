import httpx
import json
import asyncio
from typing import List, Dict, Any, Optional, Iterator, AsyncIterator

class PromptRouter:
    """Synchronous client for PromptRouter."""
    def __init__(self, api_key: str, base_url: str = "http://localhost:4000/api/v1"):
        self.api_key = api_key
        self.base_url = base_url.rstrip('/')
        self.client = httpx.Client(
            headers={"Authorization": f"Bearer {api_key}"},
            timeout=60.0
        )
        self.chat = Chat(self)

class AsyncPromptRouter:
    """Asynchronous client for PromptRouter."""
    def __init__(self, api_key: str, base_url: str = "http://localhost:4000/api/v1"):
        self.api_key = api_key
        self.base_url = base_url.rstrip('/')
        self.client = httpx.AsyncClient(
            headers={"Authorization": f"Bearer {api_key}"},
            timeout=60.0
        )
        self.chat = AsyncChat(self)

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.client.aclose()

# --- Synchronous Implementation ---

class Chat:
    def __init__(self, router: PromptRouter):
        self.completions = Completions(router)

class Completions:
    def __init__(self, router: PromptRouter):
        self.router = router

    def create(self, model: str, messages: List[Dict[str, str]], stream: bool = False, session_id: Optional[str] = None, **kwargs) -> Any:
        url = f"{self.router.base_url}/chat/completions{'/stream' if stream else ''}"
        payload = {"model": model, "messages": messages, "sessionId": session_id, **kwargs}

        if stream:
            return self._stream_request(url, payload)
        
        response = self.router.client.post(url, json=payload)
        response.raise_for_status()
        return response.json()

    def _stream_request(self, url: str, payload: Dict[str, Any]) -> Iterator[Dict[str, Any]]:
        with self.router.client.stream("POST", url, json=payload) as response:
            response.raise_for_status()
            for line in response.iter_lines():
                if line.startswith("data: "):
                    data = line[6:].strip()
                    if data == "[DONE]": break
                    try: yield json.loads(data)
                    except json.JSONDecodeError: continue

# --- Asynchronous Implementation ---

class AsyncChat:
    def __init__(self, router: AsyncPromptRouter):
        self.completions = AsyncCompletions(router)

class AsyncCompletions:
    def __init__(self, router: AsyncPromptRouter):
        self.router = router

    async def create(self, model: str, messages: List[Dict[str, str]], stream: bool = False, session_id: Optional[str] = None, **kwargs) -> Any:
        url = f"{self.router.base_url}/chat/completions{'/stream' if stream else ''}"
        payload = {"model": model, "messages": messages, "sessionId": session_id, **kwargs}

        if stream:
            return self._stream_request(url, payload)
        
        response = await self.router.client.post(url, json=payload)
        response.raise_for_status()
        return response.json()

    async def _stream_request(self, url: str, payload: Dict[str, Any]) -> AsyncIterator[Dict[str, Any]]:
        async with self.router.client.stream("POST", url, json=payload) as response:
            response.raise_for_status()
            async for line in response.aiter_lines():
                if line.startswith("data: "):
                    data = line[6:].strip()
                    if data == "[DONE]": break
                    try: yield json.loads(data)
                    except json.JSONDecodeError: continue
