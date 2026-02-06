-- Migration: Add recording_url column to calls table
-- Run this in Supabase SQL Editor

ALTER TABLE calls ADD COLUMN IF NOT EXISTS recording_url TEXT;

-- Add index for quick lookups
CREATE INDEX IF NOT EXISTS idx_calls_recording_url ON calls(recording_url) WHERE recording_url IS NOT NULL;
