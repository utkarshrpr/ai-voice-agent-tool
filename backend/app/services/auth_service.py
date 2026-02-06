from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from app.config import settings
from app.services.supabase_service import SupabaseService
from app.models.auth import User, TokenData

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class AuthService:
    """Service for authentication operations."""

    def __init__(self):
        self.db = SupabaseService()

    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        """Verify a password against its hash."""
        return pwd_context.verify(plain_password, hashed_password)

    def get_password_hash(self, password: str) -> str:
        """Hash a password."""
        return pwd_context.hash(password)

    async def authenticate_user(self, username: str, password: str) -> Optional[User]:
        """Authenticate a user with username and password."""
        # Get user from database
        response = self.db.client.table("users").select("*").eq("username", username).eq("is_active", True).execute()

        if not response.data:
            return None

        user_data = response.data[0]

        # Verify password
        if not self.verify_password(password, user_data["password_hash"]):
            return None

        return User(**user_data)

    def create_access_token(self, data: dict, expires_delta: Optional[timedelta] = None) -> str:
        """Create a JWT access token."""
        to_encode = data.copy()

        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(minutes=settings.jwt_access_token_expire_minutes)

        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(to_encode, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)
        return encoded_jwt

    def decode_token(self, token: str) -> Optional[TokenData]:
        """Decode and validate a JWT token."""
        try:
            payload = jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])
            username: str = payload.get("sub")
            if username is None:
                return None
            return TokenData(username=username)
        except JWTError:
            return None

    async def get_current_user(self, token: str) -> Optional[User]:
        """Get the current user from a JWT token."""
        token_data = self.decode_token(token)
        if token_data is None or token_data.username is None:
            return None

        # Get user from database
        response = self.db.client.table("users").select("*").eq("username", token_data.username).eq("is_active", True).execute()

        if not response.data:
            return None

        return User(**response.data[0])
