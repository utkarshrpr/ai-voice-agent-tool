from pydantic import BaseModel, Field
from typing import Optional, Literal, Dict, Any, List
from datetime import datetime
from enum import Enum


class CallStatus(str, Enum):
    """Call status enumeration."""
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"
    ERROR = "error"


class TranscriptEntry(BaseModel):
    """Single transcript entry."""
    role: Literal["agent", "user"]
    content: str
    timestamp: Optional[float] = None


class CallBase(BaseModel):
    """Base call model."""
    driver_name: str = Field(..., min_length=1, max_length=255)
    phone_number: Optional[str] = Field(None, max_length=50)
    load_number: str = Field(..., min_length=1, max_length=100)


class CallCreate(CallBase):
    """Model for creating a new call."""
    agent_config_id: str


class CallUpdate(BaseModel):
    """Model for updating a call."""
    status: Optional[CallStatus] = None
    retell_call_id: Optional[str] = None
    transcript: Optional[List[TranscriptEntry]] = None
    structured_data: Optional[Dict[str, Any]] = None
    call_duration: Optional[int] = None
    started_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None


class Call(CallBase):
    """Complete call model with database fields."""
    id: str
    agent_config_id: str
    retell_call_id: Optional[str] = None
    status: CallStatus
    transcript: Optional[List[TranscriptEntry]] = None
    structured_data: Optional[Dict[str, Any]] = None
    call_duration: Optional[int] = None
    started_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class WebCallResponse(BaseModel):
    """Response for web call creation."""
    call_id: str
    access_token: str
    agent_id: str
    sample_rate: int = 24000
