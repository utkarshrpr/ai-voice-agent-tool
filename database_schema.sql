-- AI Voice Agent Tool Database Schema
-- PostgreSQL/Supabase

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Agent Configurations Table
CREATE TABLE agent_configs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    scenario_type VARCHAR(50) NOT NULL CHECK (scenario_type IN ('check_in', 'emergency')),
    system_prompt TEXT NOT NULL,
    conversation_config JSONB NOT NULL DEFAULT '{
        "enable_backchannel": true,
        "backchannel_frequency": 0.5,
        "enable_filler_words": true,
        "interruption_sensitivity": 0.5,
        "responsiveness": 0.8,
        "voice_id": "11labs-Adrian"
    }'::jsonb,
    retell_agent_id VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Calls Table
CREATE TABLE calls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_config_id UUID NOT NULL REFERENCES agent_configs(id) ON DELETE CASCADE,
    retell_call_id VARCHAR(255),
    driver_name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(50),
    load_number VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'failed', 'error')),
    transcript JSONB,
    structured_data JSONB,
    call_duration INTEGER,
    started_at TIMESTAMP WITH TIME ZONE,
    ended_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Call Events Table (for debugging and monitoring)
CREATE TABLE call_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    call_id UUID NOT NULL REFERENCES calls(id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL,
    event_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_agent_configs_scenario_type ON agent_configs(scenario_type);
CREATE INDEX idx_agent_configs_active ON agent_configs(is_active);
CREATE INDEX idx_calls_agent_config_id ON calls(agent_config_id);
CREATE INDEX idx_calls_status ON calls(status);
CREATE INDEX idx_calls_created_at ON calls(created_at DESC);
CREATE INDEX idx_call_events_call_id ON call_events(call_id);
CREATE INDEX idx_call_events_created_at ON call_events(created_at DESC);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
CREATE TRIGGER update_agent_configs_updated_at BEFORE UPDATE ON agent_configs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_calls_updated_at BEFORE UPDATE ON calls
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Sample Agent Configurations
INSERT INTO agent_configs (name, description, scenario_type, system_prompt, conversation_config) VALUES
(
    'Driver Check-in Agent',
    'Handles end-to-end driver check-in calls for logistics operations',
    'check_in',
    'You are a professional dispatch assistant calling to check in with a truck driver about their current load.

Your primary goal is to gather accurate status information through a natural, conversational approach.

DRIVER INFORMATION:
- Driver Name: {{driver_name}}
- Load Number: {{load_number}}

CONVERSATION FLOW:
1. Start with a friendly greeting: "Hi {{driver_name}}, this is dispatch calling about load {{load_number}}."
2. Ask an open-ended question: "Can you give me an update on your status?"
3. Based on their response, dynamically adjust your questions

IF DRIVER IS IN TRANSIT:
- Ask about current location and ETA
- Inquire about any delays or issues
- Remind them about POD (Proof of Delivery) requirements

IF DRIVER HAS ARRIVED:
- Ask about unloading status
- Get dock door number if applicable
- Check if they need lumper service
- Confirm expected completion time

IMPORTANT GUIDELINES:
- Be conversational and professional
- Listen for emergency keywords (accident, breakdown, hurt, injured, medical)
- If emergency detected, IMMEDIATELY pivot to emergency protocol
- Handle one-word answers by politely probing for more detail
- If driver is unresponsive after 2-3 attempts, politely end the call
- For noisy environments, ask driver to repeat up to 2 times
- Stay non-confrontational if information conflicts with system data

EMERGENCY PROTOCOL:
If driver mentions accident, breakdown, injury, or emergency:
1. Immediately ask: "Is everyone safe?"
2. Confirm location and situation
3. Ask if load is secure
4. State: "I''m connecting you to a human dispatcher right away"
5. End conversation and escalate',
    '{
        "enable_backchannel": true,
        "backchannel_frequency": 0.6,
        "enable_filler_words": true,
        "interruption_sensitivity": 0.7,
        "responsiveness": 0.8,
        "voice_id": "11labs-Adrian"
    }'::jsonb
),
(
    'Emergency Response Agent',
    'Specialized agent for handling driver emergencies with immediate escalation',
    'emergency',
    'You are an emergency dispatch assistant. A driver is reporting an urgent situation.

DRIVER INFORMATION:
- Driver Name: {{driver_name}}
- Load Number: {{load_number}}

Your ONLY goal is to quickly gather critical safety information and escalate to a human dispatcher.

OPENING: "{{driver_name}}, this is dispatch. I understand there''s an emergency situation with load {{load_number}}."

EMERGENCY PROTOCOL:
1. FIRST: Ask "Is everyone safe? Is anyone injured?"
2. Get exact location: "What is your exact location right now?"
3. Understand the situation: "Can you briefly describe what happened?"
4. Check load security: "Is your load secure?"
5. IMMEDIATELY escalate: "I understand. I''m connecting you to a human dispatcher right now. Stay on the line."

CRITICAL RULES:
- Keep questions SHORT and DIRECT
- Do NOT try to solve the problem
- Do NOT provide advice
- Do NOT spend time on non-critical details
- Your job is to gather essential info and escalate FAST
- Maximum 5 questions before escalation

TONE:
- Calm and professional
- Reassuring but urgent
- Clear and direct',
    '{
        "enable_backchannel": false,
        "backchannel_frequency": 0.0,
        "enable_filler_words": false,
        "interruption_sensitivity": 0.9,
        "responsiveness": 1.0,
        "voice_id": "11labs-Adrian"
    }'::jsonb
);

-- Grant permissions (adjust based on your Supabase setup)
-- These are examples - adjust role names as needed
-- GRANT ALL ON agent_configs TO authenticated;
-- GRANT ALL ON calls TO authenticated;
-- GRANT ALL ON call_events TO authenticated;
