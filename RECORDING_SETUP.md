# Call Recording Playback Setup

This guide explains how to enable call recording playback in your AI Voice Agent Tool.

## Database Migration

Run the migration script to add the `recording_url` column to your database:

1. Open your Supabase dashboard
2. Navigate to SQL Editor
3. Run the following SQL:

```sql
ALTER TABLE calls ADD COLUMN IF NOT EXISTS recording_url TEXT;
CREATE INDEX IF NOT EXISTS idx_calls_recording_url ON calls(recording_url) WHERE recording_url IS NOT NULL;
```

Or run the migration file:
```bash
# From project root
psql -f add_recording_url_migration.sql
```

## How It Works

### Backend
- When a call ends, the `sync_from_retell` endpoint fetches call details from Retell AI
- Retell API returns a `recording_url` field (S3 link) if recording is available
- The URL is automatically stored in the database

### Frontend
- The Call Results View displays an audio player when `recording_url` is present
- Users can play, pause, and seek through the recording
- Native HTML5 audio controls are used for broad compatibility

## Retell AI Configuration

**Important:** Make sure call recording is enabled in your Retell AI account:

1. Log into Retell AI Dashboard
2. Go to Agent Settings
3. Enable "Call Recording" option
4. Recordings will be automatically stored in Retell's S3 bucket

## Testing

1. Create a test call through the dashboard
2. Complete the call (either end it manually or let agent end it)
3. Wait for automatic sync (or manually sync via "Sync from Retell" button)
4. Navigate to Call History and view the call
5. If recording is available, an audio player will appear

## Troubleshooting

### Recording URL Not Showing
- Check if recording is enabled in Retell AI settings
- Verify the call has ended and been synced
- Check backend logs for "Recording URL found" message
- Some recordings may take 1-2 minutes to be available after call ends

### Audio Won't Play
- Verify the URL is accessible (not blocked by CORS)
- Check browser console for errors
- Try accessing the URL directly in a new tab
- Ensure your browser supports HTML5 audio

### Database Column Missing
- Run the migration script if you haven't already
- Verify column exists: `SELECT recording_url FROM calls LIMIT 1;`

## API Response Example

Expected Retell API response structure:
```json
{
  "call_id": "xxx",
  "status": "ended",
  "transcript": [...],
  "recording_url": "https://retell-recordings.s3.amazonaws.com/..."
}
```

## Security Considerations

- Retell's S3 URLs are typically pre-signed and expire after a certain time
- For long-term storage, consider downloading and storing recordings in your own S3
- Implement proper access controls if recordings contain sensitive information
