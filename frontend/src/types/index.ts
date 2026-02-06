// Agent Configuration Types
export interface ConversationConfig {
  enable_backchannel: boolean;
  backchannel_frequency: number;
  enable_filler_words: boolean;
  interruption_sensitivity: number;
  responsiveness: number;
  voice_id: string;
  enable_end_call: boolean;
}

export interface AgentConfig {
  id: string;
  name: string;
  description?: string;
  scenario_type: 'check_in' | 'emergency';
  system_prompt: string;
  conversation_config: ConversationConfig;
  retell_agent_id?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AgentConfigCreate {
  name: string;
  description?: string;
  scenario_type: 'check_in' | 'emergency';
  system_prompt: string;
  conversation_config: ConversationConfig;
  is_active?: boolean;
}

export interface AgentConfigUpdate {
  name?: string;
  description?: string;
  scenario_type?: 'check_in' | 'emergency';
  system_prompt?: string;
  conversation_config?: ConversationConfig;
  is_active?: boolean;
}

// Call Types
export type CallStatus = 'pending' | 'in_progress' | 'completed' | 'failed' | 'error';

export interface TranscriptEntry {
  role: 'agent' | 'user';
  content: string;
  timestamp?: number;
}

export interface Call {
  id: string;
  agent_config_id: string;
  retell_call_id?: string;
  driver_name: string;
  phone_number?: string;
  load_number: string;
  status: CallStatus;
  transcript?: TranscriptEntry[];
  structured_data?: StructuredData;
  call_duration?: number;
  started_at?: string;
  ended_at?: string;
  created_at: string;
  updated_at: string;
}

export interface CallCreate {
  agent_config_id: string;
  driver_name: string;
  phone_number?: string;
  load_number: string;
}

export interface WebCallResponse {
  call_id: string;
  access_token: string;
  agent_id: string;
  sample_rate: number;
}

// Structured Data Types
export interface CheckInData {
  call_outcome: 'In-Transit Update' | 'Arrival Confirmation' | 'Incomplete';
  driver_status?: 'Driving' | 'Delayed' | 'Arrived' | 'Unloading';
  current_location?: string;
  eta?: string;
  delay_reason?: string;
  unloading_status?: string;
  pod_reminder_acknowledged: boolean;
}

export interface EmergencyData {
  call_outcome: 'Emergency Escalation' | 'Incomplete';
  emergency_type?: 'Accident' | 'Breakdown' | 'Medical' | 'Other';
  safety_status?: string;
  injury_status?: string;
  emergency_location?: string;
  load_secure?: boolean;
  escalation_status: string;
}

export type StructuredData = CheckInData | EmergencyData;

// UI Types
export interface AlertMessage {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
}
