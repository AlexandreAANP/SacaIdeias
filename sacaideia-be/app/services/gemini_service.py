import importlib
import json
import os
from dataclasses import dataclass
from uuid import uuid4

from app.prompts import IdeiaAgent


@dataclass
class ChatSession:
    chat: object


class GeminiService:
    def __init__(self) -> None:
        self.api_key = os.getenv("GEMINI_API_KEY")
        self.model_name = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")
        self.system_prompt = IdeiaAgent.AGENT_IDEIA_PROMPT
        self._client = None
        self._sessions: dict[str, ChatSession] = {}
        self._genai = importlib.import_module("google.generativeai")

        if self.api_key:
            self._genai.configure(api_key=self.api_key)
            self._client = self._genai.GenerativeModel(
                self.model_name,
                system_instruction=self.system_prompt,
            )

    def start_conversation(self, message: str) -> dict[str, str]:
        if self._client is None:
            raise ValueError("GEMINI_API_KEY is not configured")

        chat = self._client.start_chat(history=[])
        response = chat.send_message(message)
        conversation_id = str(uuid4())
        self._sessions[conversation_id] = ChatSession(chat=chat)
        return self._parse_response(response.text, conversation_id)

    def continue_conversation(
        self,
        conversation_id: str,
        message: str,
        history: list[dict[str, object]] | None = None,
    ) -> dict[str, str]:
        if self._client is None:
            raise ValueError("GEMINI_API_KEY is not configured")

        session = self._sessions.get(conversation_id)
        if session is None:
            if history is None:
                raise ValueError("Conversation not found")
            session = ChatSession(chat=self._client.start_chat(history=history))
            self._sessions[conversation_id] = session

        response = session.chat.send_message(message)
        return self._parse_response(response.text, conversation_id)

    def _parse_response(self, response_text: str, conversation_id: str) -> dict[str, str]:
        data = json.loads(response_text)
        data["conversationId"] = conversation_id
        return data
    
