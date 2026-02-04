from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime
from enum import Enum


class CallStatus(str, Enum):
    INITIATED = "initiated"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"


class CallCreate(BaseModel):
    agent_config_id: str
    driver_name: str
    driver_phone: str
    load_number: str


class Call(BaseModel):
    id: str
    agent_config_id: str
    driver_name: str
    driver_phone: str
    load_number: str
    call_status: str
    retell_call_id: Optional[str] = None
    started_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None
    duration_seconds: Optional[int] = None
    raw_transcript: Optional[Dict[str, Any]] = None
    structured_data: Optional[Dict[str, Any]] = None
    created_at: datetime

    class Config:
        from_attributes = True


class CallEvent(BaseModel):
    id: str
    call_id: str
    event_type: str
    event_data: Dict[str, Any]
    timestamp: datetime

    class Config:
        from_attributes = True
