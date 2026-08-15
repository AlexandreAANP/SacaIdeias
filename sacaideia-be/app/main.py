import os
from typing import Annotated, Literal

import jwt
from dotenv import load_dotenv
from fastapi import Cookie, Depends, FastAPI, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from .services.gemini_service import GeminiService
from .services.google_auth_service import GoogleAuthService
from .services.conversation_service import ConversationService

load_dotenv()

app = FastAPI(title=os.getenv("APP_NAME", "SacaIdeias API"))
gemini_service = GeminiService()
google_auth_service = GoogleAuthService()
conversation_service = ConversationService()


class SacaIdeiaRequest(BaseModel):
    ideia: str


class ContinueConversationRequest(BaseModel):
    conversation_id: str
    message: str


class GoogleLoginRequest(BaseModel):
    credential: str


def require_authenticated_user(
    sacaideias_token: str | None = Cookie(default=None),
) -> dict[str, object]:
    if not sacaideias_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token is missing",
        )

    try:
        user_info = google_auth_service.verify_jwt(sacaideias_token)
        if user_info["sub"] != "alexandreaanp@gmail.com":
            raise HTTPException(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        detail="Authentication token is invalid or expired",
                    )
        return user_info
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token is invalid or expired",
        )

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4200"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root() -> dict[str, str]:
    return {"message": "SacaIdeias backend is running"}


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}

@app.post("/api/v1/saca-ideia")
async def saca_ideia(
    payload: SacaIdeiaRequest,
    current_user: Annotated[dict[str, object], Depends(require_authenticated_user)],
) -> dict[str, object]:
    response = gemini_service.start_conversation(payload.ideia)
    conversation_service.create_conversation(
        response["conversationId"],
        current_user,
        payload.ideia,
        response,
    )
    return response


@app.post("/api/v1/saca-ideia/chat")
async def saca_ideia_chat(
    payload: ContinueConversationRequest,
    current_user: Annotated[dict[str, object], Depends(require_authenticated_user)],
) -> dict[str, str]:
    user_email = str(current_user.get("email", current_user.get("sub", "")))
    history = conversation_service.get_gemini_history(
        payload.conversation_id,
        user_email,
    )
    response = gemini_service.continue_conversation(
        payload.conversation_id,
        payload.message,
        history,
    )
    conversation_service.append_exchange(
        payload.conversation_id,
        user_email,
        payload.message,
        response,
    )
    return response


@app.get("/api/v1/conversations")
async def get_conversations(
    current_user: Annotated[dict[str, object], Depends(require_authenticated_user)],
    offset: Annotated[int, Query(ge=0)] = 0,
    limit: Annotated[int, Query(ge=1, le=100)] = 3,
    order_by: Annotated[Literal["created_at", "updated_at"], Query()] = "updated_at",
    order_direction: Annotated[Literal["asc", "desc"], Query()] = "desc",
) -> dict[str, object]:
    user_email = str(current_user.get("email", current_user.get("sub", "")))
    conversations = conversation_service.get_user_conversations(
        user_email,
        order_by=order_by,
        order_direction=order_direction,
    )
    page = conversations[offset : offset + limit]

    return {
        "conversations": page,
        "has_more": offset + len(page) < len(conversations),
    }


@app.delete("/api/v1/conversations/{conversation_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_conversation(
    conversation_id: str,
    current_user: Annotated[dict[str, object], Depends(require_authenticated_user)],
) -> None:
    user_email = str(current_user.get("email", current_user.get("sub", "")))
    deleted = conversation_service.delete_user_conversation(conversation_id, user_email)

    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation was not found",
        )


@app.post("/api/v1/auth/google")
async def google_login(payload: GoogleLoginRequest) -> dict[str, object]:
    return google_auth_service.login_with_google(payload.credential)

