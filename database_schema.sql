-- Supabase Database Schema for AI Voice Agent Tool

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table: agent_configs
CREATE TABLE agent_configs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    system_prompt TEXT NOT NULL,
    conversation_config JSONB NOT NULL DEFAULT '{}'::jsonb,
    scenario_type TEXT NOT NULL CHECK (scenario_type IN ('check_in', 'emergency')),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table: calls
CREATE TABLE calls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_config_id UUID NOT NULL REFERENCES agent_configs(id) ON DELETE CASCADE,
    driver_name TEXT NOT NULL,
    driver_phone TEXT NOT NULL,
    load_number TEXT NOT NULL,
    call_status TEXT NOT NULL CHECK (call_status IN ('initiated', 'in_progress', 'completed', 'failed')),
    retell_call_id TEXT,
    started_at TIMESTAMP WITH TIME ZONE,
    ended_at TIMESTAMP WITH TIME ZONE,
    duration_seconds INTEGER,
    raw_transcript JSONB,
    structured_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table: call_events
CREATE TABLE call_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    call_id UUID NOT NULL REFERENCES calls(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    event_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better query performance
CREATE INDEX idx_agent_configs_scenario ON agent_configs(scenario_type);
CREATE INDEX idx_agent_configs_active ON agent_configs(is_active);
CREATE INDEX idx_calls_agent_config ON calls(agent_config_id);
CREATE INDEX idx_calls_status ON calls(call_status);
CREATE INDEX idx_calls_created ON calls(created_at DESC);
CREATE INDEX idx_call_events_call_id ON call_events(call_id);
CREATE INDEX idx_call_events_timestamp ON call_events(timestamp);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to auto-update updated_at
CREATE TRIGGER update_agent_configs_updated_at
    BEFORE UPDATE ON agent_configs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Sample agent configurations for testing

-- Check-in Agent
INSERT INTO agent_configs (name, description, system_prompt, conversation_config, scenario_type, is_active)
VALUES (
    'Driver Check-in Agent',
    'Agent for checking in with drivers about their delivery status',
    'You are a friendly logistics coordinator calling to check in with a driver. Your goals are:

1. Determine if the driver is in-transit or has arrived at the delivery location
2. If in-transit:
   - Get their current location
   - Ask for estimated time of arrival (ETA)
   - If delayed, understand the reason
3. If arrived:
   - Check if they have started unloading
   - Remind them about proof of delivery (POD) procedures
4. Always be professional, friendly, and understanding
5. If the driver mentions ANY emergency situation, immediately pivot to safety questions

Keep the conversation natural and conversational. Use filler words occasionally to sound human.',
    '{
        "voice_id": "default",
        "enable_backchannel": true,
        "backchannel_frequency": 0.8,
        "enable_filler_words": true,
        "filler_words": ["um", "uh", "you know"],
        "interruption_sensitivity": 0.5,
        "responsiveness": 0.7,
        "ambient_sound": "office"
    }'::jsonb,
    'check_in',
    true
);

-- Emergency Protocol Agent
INSERT INTO agent_configs (name, description, system_prompt, conversation_config, scenario_type, is_active)
VALUES (
    'Emergency Protocol Agent',
    'Agent for handling emergency situations with immediate safety focus',
    'You are an emergency response coordinator. When an emergency is detected:

1. IMMEDIATELY ask: "Are you safe right now? Do you or anyone else need immediate medical attention?"
2. Determine the type of emergency (accident, breakdown, medical, tire blowout, other)
3. Get the exact location of the emergency
4. Confirm if the load is secure
5. Reassure them that help is being dispatched
6. Stay calm, professional, and focused on safety

NEVER ask about delivery timelines or non-critical matters during an emergency.
Always prioritize human safety over cargo or schedules.

Keep your tone calm and reassuring while gathering critical information efficiently.',
    '{
        "voice_id": "default",
        "enable_backchannel": true,
        "backchannel_frequency": 0.6,
        "enable_filler_words": false,
        "filler_words": [],
        "interruption_sensitivity": 0.3,
        "responsiveness": 0.9,
        "ambient_sound": null
    }'::jsonb,
    'emergency',
    true
);
