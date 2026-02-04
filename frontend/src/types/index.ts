export enum ScenarioType {
  CHECK_IN = 'check_in',
  EMERGENCY = 'emergency',
}

export enum CallStatus {
  INITIATED = 'initiated',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export interface ConversationConfig {
  voice_id: string;
  enable_backchannel: boolean;
  backchannel_frequency: number;
  enable_filler_words: boolean;
  filler_words: string[];
  interruption_sensitivity: number;
  responsiveness: number;
  ambient_sound?: string;
}

export interface AgentConfig {
  id: string;
  name: string;
  description: string;
  system_prompt: string;
  conversation_config: ConversationConfig;
  scenario_type: ScenarioType;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AgentConfigCreate {
  name: string;
  description: string;
  system_prompt: string;
  conversation_config: ConversationConfig;
  scenario_type: ScenarioType;
  is_active: boolean;
}

export interface Call {
  id: string;
  agent_config_id: string;
  driver_name: string;
  driver_phone: string;
  load_number: string;
  call_status: CallStatus;
  retell_call_id?: string;
  started_at?: string;
  ended_at?: string;
  duration_seconds?: number;
  raw_transcript?: TranscriptMessage[];
  structured_data?: Record<string, any>;
  created_at: string;
}

export interface CallCreate {
  agent_config_id: string;
  driver_name: string;
  driver_phone: string;
  load_number: string;
}

export interface TranscriptMessage {
  role: 'user' | 'assistant';
  content: string;
}
