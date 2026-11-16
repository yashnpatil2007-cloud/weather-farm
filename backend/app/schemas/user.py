import re

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def validate_email(value: str) -> str:
    if not EMAIL_RE.match(value):
        raise ValueError("Enter a valid email address.")
    return value.lower()


class UserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    full_name: str
    email: str
    phone: str | None = None
    location: str | None = None
    preferred_language: str = "en"
    role: str
    is_active: bool
    created_at: object


class UserCreate(BaseModel):
    full_name: str = Field(min_length=2, max_length=120)
    email: str = Field(max_length=160)
    password: str = Field(min_length=6, max_length=128)
    phone: str | None = Field(default=None, max_length=40)
    location: str | None = Field(default=None, max_length=255)
    preferred_language: str | None = Field(default=None, max_length=8)

    @field_validator("email")
    @classmethod
    def check_email(cls, v: str) -> str:
        return validate_email(v)


class UserLogin(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserRead