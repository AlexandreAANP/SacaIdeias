import json
import os
from datetime import datetime, timezone
from pathlib import Path
from threading import RLock
from typing import Any, Literal


class ConversationService:
    """Persists conversations and associates each one with its authenticated user."""

    def __init__(self) -> None:
        self.conversations_file = Path(
            os.getenv("CONVERSATIONS_FILE", "data/conversations.json")
        )
        self._lock = RLock()

    def create_conversation(
        self,
        conversation_id: str,
        user: dict[str, object],
        user_message: str,
        assistant_response: dict[str, Any],
    ) -> None:
        now = self._timestamp()
        conversation = {
            "id": conversation_id,
            "user": self._user_details(user),
            "created_at": now,
            "updated_at": now,
            "tags": assistant_response["tags"][:3],
            "messages": [
                self._message("user", user_message, now),
                self._assistant_message(assistant_response, now),
            ],
        }

        with self._lock:
            conversations = self._load_conversations()
            conversations.append(conversation)
            self._save_conversations(conversations)

    def append_exchange(
        self,
        conversation_id: str,
        user_email: str,
        user_message: str,
        assistant_response: dict[str, Any],
    ) -> None:
        now = self._timestamp()
        with self._lock:
            conversations = self._load_conversations()
            conversation = next(
                (item for item in conversations if item.get("id") == conversation_id),
                None,
            )
            if conversation is None:
                raise ValueError("Conversation was not found in persistent storage")

            owner_email = str(conversation.get("user", {}).get("email", ""))
            if owner_email != user_email:
                raise ValueError("Conversation does not belong to the authenticated user")

            conversation["messages"].extend(
                [
                    self._message("user", user_message, now),
                    self._assistant_message(assistant_response, now),
                ]
            )
            conversation["updated_at"] = now
            self._save_conversations(conversations)

    def get_user_conversations(
        self,
        user_email: str,
        order_by: Literal["created_at", "updated_at"] = "updated_at",
        order_direction: Literal["asc", "desc"] = "desc",
    ) -> list[dict[str, Any]]:
        """Return persisted conversations belonging to one authenticated user."""
        with self._lock:
            conversations = self._load_conversations()
            user_conversations = [
                conversation
                for conversation in conversations
                if str(conversation.get("user", {}).get("email", "")) == user_email
            ]
            return sorted(
                user_conversations,
                key=lambda conversation: str(conversation.get(order_by, "")),
                reverse=order_direction == "desc",
            )

    def delete_user_conversation(self, conversation_id: str, user_email: str) -> bool:
        """Delete a conversation only when it belongs to the authenticated user."""
        with self._lock:
            conversations = self._load_conversations()
            conversation = next(
                (item for item in conversations if item.get("id") == conversation_id),
                None,
            )

            if conversation is None:
                return False

            owner_email = str(conversation.get("user", {}).get("email", ""))
            if owner_email != user_email:
                return False

            self._save_conversations(
                [item for item in conversations if item.get("id") != conversation_id]
            )
            return True

    def get_gemini_history(
        self, conversation_id: str, user_email: str
    ) -> list[dict[str, Any]]:
        """Build Gemini ``start_chat(history=...)`` history for a user's conversation."""
        with self._lock:
            conversations = self._load_conversations()
            conversation = next(
                (item for item in conversations if item.get("id") == conversation_id),
                None,
            )

        if conversation is None:
            raise ValueError("Conversation was not found in persistent storage")

        owner_email = str(conversation.get("user", {}).get("email", ""))
        if owner_email != user_email:
            raise ValueError("Conversation does not belong to the authenticated user")

        history: list[dict[str, Any]] = []
        for message in conversation.get("messages", []):
            role = message.get("role")
            if role == "user":
                history.append({"role": "user", "parts": [message.get("content", "")]})
            elif role == "assistant":
                response = message.get("response")
                if isinstance(response, dict):
                    # conversationId is added by this API and was not part of Gemini's reply.
                    response = {
                        key: value
                        for key, value in response.items()
                        if key != "conversationId"
                    }
                    content = json.dumps(response, ensure_ascii=False)
                else:
                    content = message.get("content", "")

                history.append({"role": "model", "parts": [content]})

        return history

    def _load_conversations(self) -> list[dict[str, Any]]:
        if not self.conversations_file.exists():
            return []

        try:
            data = json.loads(self.conversations_file.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            return []

        return data if isinstance(data, list) else []

    def _save_conversations(self, conversations: list[dict[str, Any]]) -> None:
        self.conversations_file.parent.mkdir(parents=True, exist_ok=True)
        self.conversations_file.write_text(
            json.dumps(conversations, indent=2, ensure_ascii=False),
            encoding="utf-8",
        )

    @staticmethod
    def _timestamp() -> str:
        return datetime.now(timezone.utc).isoformat()

    @staticmethod
    def _user_details(user: dict[str, object]) -> dict[str, str]:
        return {
            "email": str(user.get("email", user.get("sub", ""))),
            "name": str(user.get("name", "")),
        }

    @staticmethod
    def _message(role: str, content: str, created_at: str) -> dict[str, str]:
        return {"role": role, "content": content, "created_at": created_at}

    def _assistant_message(
        self, assistant_response: dict[str, Any], created_at: str
    ) -> dict[str, Any]:
        message = self._message(
            "assistant", str(assistant_response.get("content", "")), created_at
        )
        message["response"] = assistant_response
        return message
