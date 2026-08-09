import json
import os
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any

import jwt
from google.auth.transport.requests import Request
from google.oauth2 import id_token


class GoogleAuthService:
    def __init__(self) -> None:
        self.client_id = os.getenv("GOOGLE_CLIENT_ID")
        self.jwt_secret = os.getenv("JWT_SECRET", "change-me-in-production")
        self.jwt_algorithm = os.getenv("JWT_ALGORITHM", "HS256")
        self.jwt_exp_minutes = int(os.getenv("JWT_EXP_MINUTES", "60"))
        self.users_file = Path(os.getenv("USERS_FILE", "data/users.json"))

    def login_with_google(self, google_credential: str) -> dict[str, Any]:
        if not self.client_id:
            raise ValueError("GOOGLE_CLIENT_ID is not configured")

        payload = id_token.verify_oauth2_token(
            google_credential,
            Request(),
            self.client_id,
        )

        email = payload.get("email")
        if not email:
            raise ValueError("Google token does not contain an email")

        user = {
            "email": email,
            "name": payload.get("name", ""),
            "picture": payload.get("picture", ""),
            "google_subject": payload.get("sub", ""),
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }

        self._save_user(user)

        token = self._create_jwt(user)
        return {"token": token, "user": user}

    def _create_jwt(self, user: dict[str, Any]) -> str:
        expires_at = datetime.now(timezone.utc) + timedelta(minutes=self.jwt_exp_minutes)
        payload = {
            "sub": user["email"],
            "email": user["email"],
            "name": user.get("name", ""),
            "picture": user.get("picture", ""),
            "exp": expires_at,
            "iat": datetime.now(timezone.utc),
        }
        return jwt.encode(payload, self.jwt_secret, algorithm=self.jwt_algorithm)

    def verify_jwt(self, token: str) -> dict[str, Any]:
        return jwt.decode(
            token,
            self.jwt_secret,
            algorithms=[self.jwt_algorithm],
            options={"require": ["exp", "iat", "sub"]},
        )

    def _save_user(self, user: dict[str, Any]) -> None:
        self.users_file.parent.mkdir(parents=True, exist_ok=True)
        users = self._load_users()

        existing_index = next(
            (index for index, item in enumerate(users) if item.get("email") == user["email"]),
            None,
        )

        if existing_index is None:
            users.append(user)
        else:
            users[existing_index] = user

        self.users_file.write_text(json.dumps(users, indent=2), encoding="utf-8")

    def _load_users(self) -> list[dict[str, Any]]:
        if not self.users_file.exists():
            return []

        try:
            return json.loads(self.users_file.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            return []