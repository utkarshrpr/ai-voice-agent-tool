from pydantic import BaseModel, Field
from typing import Optional, Literal
from datetime import datetime


class ConversationConfig(BaseModel):
    """Retell AI conversation configuration settings."""
    enable_backchannel: bool = True
    backchannel_frequency: float = Field(default=0.5, ge=0.0, le=1.0)
    enable_filler_words: bool = True
    interruption_sensitivity: float = Field(default=0.5, ge=0.0, le=1.0)
    responsiveness: float = Field(default=0.8, ge=0.0, le=1.0)
    voice_id: str = "11labs-Adrian"
    enable_end_call: bool = False


class AgentConfigBase(BaseModel):
    """Base agent configuration model."""
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    scenario_type: Literal["check_in", "emergency"]
    system_prompt: str = Field(..., min_length=10)
    conversation_config: ConversationConfig = Field(default_factory=ConversationConfig)
    is_active: bool = True


class AgentConfigCreate(AgentConfigBase):
    """Model for creating a new agent configuration."""
    pass


class AgentConfigUpdate(BaseModel):
    """Model for updating an agent configuration."""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    scenario_type: Optional[Literal["check_in", "emergency"]] = None
    system_prompt: Optional[str] = Field(None, min_length=10)
    conversation_config: Optional[ConversationConfig] = None
    is_active: Optional[bool] = None


class AgentConfig(AgentConfigBase):
    """Complete agent configuration model with database fields."""
    id: str
    retell_agent_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
