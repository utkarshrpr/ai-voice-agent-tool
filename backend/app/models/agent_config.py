from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime
from enum import Enum


class ScenarioType(str, Enum):
    CHECK_IN = "check_in"
    EMERGENCY = "emergency"


class ConversationConfig(BaseModel):
    voice_id: str = "default"
    enable_backchannel: bool = True
    backchannel_frequency: float = 0.8
    enable_filler_words: bool = True
    filler_words: list[str] = ["um", "uh", "you know"]
    interruption_sensitivity: float = 0.5
    responsiveness: float = 0.7
    ambient_sound: Optional[str] = "office"


class AgentConfigCreate(BaseModel):
    name: str
    description: str
    system_prompt: str
    conversation_config: ConversationConfig
    scenario_type: ScenarioType
    is_active: bool = True


class AgentConfigUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    system_prompt: Optional[str] = None
    conversation_config: Optional[ConversationConfig] = None
    scenario_type: Optional[ScenarioType] = None
    is_active: Optional[bool] = None


class AgentConfig(BaseModel):
    id: str
    name: str
    description: str
    system_prompt: str
    conversation_config: Dict[str, Any]
    scenario_type: str
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
