from datetime import datetime, timedelta, timezone
from typing import Any, Union
import bcrypt
import jwt
from app.core.config import settings


def get_password_hash(password: str) -> str:
    """Generate bcrypt password hash using standard bcrypt library."""
    # Truncate string to maximum 72 bytes as required by bcrypt specification
    password_bytes = password.encode('utf-8')[:72]
    salt = bcrypt.gensalt(rounds=12)
    hashed_bytes = bcrypt.hashpw(password_bytes, salt)
    return hashed_bytes.decode('utf-8')


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify plain text password against stored bcrypt hash."""
    plain_bytes = plain_password.encode('utf-8')[:72]
    hashed_bytes = hashed_password.encode('utf-8')
    return bcrypt.checkpw(plain_bytes, hashed_bytes)


def create_access_token(
    subject: Union[str, int],
    role: str,
    expires_delta: Union[timedelta, None] = None
) -> str:
    """Create a signed JWT access token."""
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode = {
        "sub": str(subject),
        "role": role,
        "exp": int(expire.timestamp()),
        "iat": int(datetime.now(timezone.utc).timestamp()),
    }

    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def decode_access_token(token: str) -> dict[str, Any]:
    """Decode and validate JWT access token."""
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )
        return payload
    except jwt.PyJWTError as e:
        raise ValueError(f"Invalid token: {str(e)}")
