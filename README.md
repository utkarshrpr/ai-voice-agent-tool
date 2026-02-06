# Relay

**AI Voice Agents for Logistics**

A comprehensive web application for managing AI voice agents and conducting browser-based voice calls using Retell AI. Built for non-technical administrators to configure, test, and review adaptive AI voice agent calls for logistics operations.

## Features

### Core Functionality
- **Agent Configuration**: Create and manage AI voice agents with customizable system prompts and conversation settings
- **Web-Based Calls**: Initiate voice calls directly from the browser (no phone required)
- **Real-time Call Controls**: Mute/unmute, end call, and monitor call duration
- **Automatic Call Sync**: Calls automatically sync with Retell AI when ended
- **Call Recording Playback**: Listen to full call recordings with built-in audio player
- **Structured Data Extraction**: Automatically extract and display key information from call transcripts using LLM
- **Call History & Analytics**: Browse past calls with advanced filtering and analytics

### Dashboard Analytics
- Active agents count
- Total calls and completed calls count
- **Average call duration** across all calls
- **Min/Max call duration** metrics
- Recent calls list with quick access

### Advanced Features
- **Dynamic Prompts**: Use `{{driver_name}}` and `{{load_number}}` variables for personalized greetings
- **Voice Selection**: Choose from 10 different voices (5 male, 5 female) across different regions
- **Agent End Call**: Allow agents to programmatically end calls when conversation is complete
- **Call Filtering**: Filter call history by status, driver name, and date range
- **Emergency Detection**: Automatic detection and escalation of emergency situations

### Scenario Types
- **Check-in**: Routine driver check-ins for logistics operations
- **Emergency**: Emergency response protocol with immediate escalation

## Tech Stack

### Backend
- **FastAPI**: Modern Python web framework
- **Supabase**: PostgreSQL database
- **Retell AI**: Voice AI platform for web calls
- **Anthropic Claude**: LLM for transcript processing and structured data extraction
- **Pydantic**: Data validation

### Frontend
- **React 18**: UI framework
- **TypeScript**: Type-safe JavaScript
- **Vite**: Fast build tool
- **Tailwind CSS**: Utility-first styling
- **Framer Motion**: Smooth animations
- **Retell Web SDK**: Browser-based voice calling
- **Axios**: HTTP client

## Project Structure

```
relay/
├── backend/
│   ├── app/
│   │   ├── models/          # Pydantic data models
│   │   ├── services/        # Business logic (Supabase, Retell, LLM, Auth)
│   │   ├── routers/         # API endpoints
│   │   ├── utils/           # Helper utilities
│   │   ├── config.py        # Settings management
│   │   └── main.py          # FastAPI app
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── contexts/        # React contexts (Auth)
│   │   ├── pages/           # Page components
│   │   ├── services/        # API client
│   │   └── types/           # TypeScript types
│   ├── package.json
│   └── .env.example
├── database_schema.sql      # Complete database setup
└── README.md
```

## Setup Instructions

### Prerequisites

- Python 3.9+
- Node.js 18+
- Supabase account (free tier works)
- Retell AI account (with web call capabilities)
- Anthropic API key

### 1. Database Setup

1. Create a new project in [Supabase](https://supabase.com)
2. Go to SQL Editor and run the contents of `database_schema.sql`
3. Note your Supabase URL and anon key from Project Settings > API

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your credentials:
#   SUPABASE_URL=your-supabase-url
#   SUPABASE_KEY=your-supabase-anon-key
#   RETELL_API_KEY=your-retell-api-key
#   ANTHROPIC_API_KEY=your-anthropic-key

# Run the server
uvicorn app.main:app --reload
```

The backend will be available at `http://localhost:8000`

Health check: `http://localhost:8000/health`

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env:
#   VITE_API_BASE_URL=http://localhost:8000/api

# Run development server
npm run dev
```

The frontend will be available at `http://localhost:5173`





## Usage Guide

### Creating an Agent

1. Navigate to **Agent Configuration** page
2. Click **Create New Agent**
3. Fill in the form:
   - **Name**: Descriptive name (e.g., "Driver Check-in Agent")
   - **Description**: Optional brief description
   - **Scenario Type**: Choose "Check-in" or "Emergency Response"
   - **System Prompt**: Define the agent's behavior
     - Use `{{driver_name}}` for dynamic driver name
     - Use `{{load_number}}` for dynamic load number
   - **Conversation Settings**:
     - **Voice**: Select from 10 voice options (male/female, different regions)
     - **Enable Backchannel**: Allow "uh-huh", "yeah" responses
     - **Backchannel Frequency**: 0-1 (how often agent uses backchannel)
     - **Enable Filler Words**: Natural speech patterns
     - **Enable Agent End Call**: Allow agent to end call when complete
     - **Interruption Sensitivity**: 0-1 (higher = more interruptible)
     - **Responsiveness**: 0-1 (higher = faster responses)
   - **Active**: Toggle to enable/disable the agent
4. Click **Create Agent**

The agent will be automatically created in Retell AI and synced.

### Starting a Web Call

1. Go to **Dashboard**
2. Select an agent from the dropdown
3. Enter:
   - **Driver Name**: Required (e.g., "Mike Johnson")
   - **Load Number**: Required (e.g., "7891-B")
   - **Phone Number**: Optional (for record-keeping only)
4. Click **Start Web Call**
5. Allow microphone permissions when prompted
6. Speak naturally with the AI agent
7. Use controls:
   - **Mute/Unmute**: Toggle your microphone
   - **End Call**: Terminate the call

The call automatically syncs when ended (by user or agent).

### Viewing Call Results

1. Navigate to **Call History**
2. Use filters:
   - **Status**: Filter by pending, in_progress, completed, failed
   - **Driver Name**: Search by driver name (press Enter to search)
   - **Date Range**: Filter by creation date
3. Click on a call to view:
   - **Call Metadata**: Driver name, load number, duration, timestamps
   - **Call Recording**: Audio player to listen to the full conversation
   - **Structured Data**: Key information extracted from the conversation
   - **Full Transcript**: Complete conversation with speaker labels
4. Use **Sync from Retell** button to manually fetch latest data

## Dashboard Metrics

The dashboard displays real-time analytics:

- **Active Agents**: Number of active agent configurations
- **Total Calls**: Total number of calls in the system
- **Completed**: Number of successfully completed calls
- **Avg Duration**: Average call duration across all calls
- **Min Duration**: Shortest call duration
- **Max Duration**: Longest call duration

## Structured Data Extraction

### Check-in Scenario

Extracted fields:
- `call_outcome`: "In-Transit Update" | "Arrival Confirmation" | "Incomplete"
- `driver_status`: "Driving" | "Delayed" | "Arrived" | "Unloading"
- `current_location`: Driver's current location
- `eta`: Estimated time of arrival
- `delay_reason`: Reason for any delays
- `unloading_status`: Dock information, lumper status
- `pod_reminder_acknowledged`: Whether driver acknowledged POD reminder

### Emergency Scenario

Extracted fields:
- `call_outcome`: "Emergency Escalation" | "Incomplete"
- `emergency_type`: "Accident" | "Breakdown" | "Medical" | "Other"
- `safety_status`: Confirmation of safety
- `injury_status`: Injury information
- `emergency_location`: Exact emergency location
- `load_secure`: Whether load is secure
- `escalation_status`: Always "Connected to Human Dispatcher"

## API Endpoints

### Agent Configuration
- `POST /api/agents/` - Create agent
- `GET /api/agents/` - List agents (query: `active_only`)
- `GET /api/agents/{id}` - Get agent details
- `PUT /api/agents/{id}` - Update agent (syncs with Retell)
- `DELETE /api/agents/{id}` - Delete agent

### Calls
- `POST /api/calls/web-call` - Create web call (returns access token)
- `GET /api/calls/` - List calls (query: `status_filter`, `driver_name`, `created_after`, `created_before`, `limit`)
- `GET /api/calls/stats` - Get call statistics (total, completed, durations)
- `GET /api/calls/{id}` - Get call details
- `POST /api/calls/{id}/sync-from-retell` - Manually sync call from Retell
- `DELETE /api/calls/{id}` - Delete call

### Webhooks
- `POST /api/webhooks/retell` - Retell AI webhook handler

### Health
- `GET /health` - Health check and service status

## Environment Variables

### Backend (.env)

```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-supabase-anon-key

# Retell AI
RETELL_API_KEY=your-retell-api-key

# LLM
ANTHROPIC_API_KEY=your-anthropic-key

# Application
ENVIRONMENT=development
DEBUG=true
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
```

### Frontend (.env)

```env
VITE_API_BASE_URL=http://localhost:8000/api
```

## Available Voices

### Male Voices
- **Adrian** - Young (American)
- **Anthony** - Middle Aged (British)
- **Charlie** - Middle Aged (Australian)
- **Amritanshu** - Middle Aged (Indian)
- **Santiago** - Middle Aged (Spanish)

### Female Voices
- **Anna** - Young (American)
- **Carola** - Middle Aged (German)
- **Dorothy** - Young (British)
- **Monika** - Middle Aged (Indian)
- **Grace** - Middle Aged (American)

## Troubleshooting

### Backend Issues

**Error: "No LLM API key configured"**
- Ensure `ANTHROPIC_API_KEY` is set in backend `.env`

**Error: "Failed to connect to Supabase"**
- Verify `SUPABASE_URL` and `SUPABASE_KEY` are correct
- Check that database schema has been run

**Error: "Retell agent creation failed"**
- Verify `RETELL_API_KEY` is valid
- Check Retell AI dashboard for API errors
- Ensure you have web call capabilities enabled

**Call not syncing after ending**
- Check browser console for sync errors
- Manually use "Sync from Retell" button
- Verify call exists in Retell dashboard

### Frontend Issues

**Error: "Network Error"**
- Ensure backend is running on port 8000
- Check `VITE_API_BASE_URL` in frontend `.env`
- Verify CORS settings in backend

**Microphone permission denied**
- Allow microphone access in browser settings
- Try using HTTPS (required for some browsers)
- Check browser console for errors

**Call doesn't connect**
- Verify Retell agent was created successfully
- Check browser console for Retell SDK errors
- Ensure valid access token was returned
- Verify internet connection stability

**Recording not showing**
- Ensure recording is enabled in Retell AI settings
- Wait 1-2 minutes after call ends for processing
- Manually sync the call
- Verify database schema was properly initialized

### Call Quality Issues

**Agent responds slowly**
- Increase `responsiveness` setting (0.8-1.0)
- Check your internet connection
- Verify LLM API is responding quickly

**Agent interrupts too much**
- Decrease `interruption_sensitivity` (0.3-0.5)

**Agent doesn't use backchannel**
- Enable `enable_backchannel`
- Increase `backchannel_frequency` (0.6-0.8)

**Agent doesn't end call automatically**
- Ensure `enable_end_call` is enabled in agent settings
- Verify agent prompt includes ending criteria

## Building for Production

### Backend

```bash
cd backend
# Use a production WSGI server
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

### Frontend

```bash
cd frontend
npm run build
# Serve the dist/ folder with a web server (nginx, Apache, etc.)
```

## Security Notes

- Never commit `.env` files
- Use environment variables for all secrets
- Enable HTTPS in production
- Restrict CORS origins in production
- Use Supabase Row Level Security (RLS) policies
- Rotate API keys regularly
- Recording URLs from Retell are pre-signed and expire
- Consider downloading and storing recordings in your own S3 for long-term storage

## Sample System Prompts

### Check-in Agent

```
You are a professional dispatch assistant calling to check in with a truck driver.

Your goal is to gather status information through natural conversation.

DRIVER INFORMATION:
- Driver Name: {{driver_name}}
- Load Number: {{load_number}}

CONVERSATION FLOW:
1. Greeting: "Hi {{driver_name}}, this is dispatch calling about load {{load_number}}. Can you give me an update?"
2. Listen and adapt based on their response
3. If in transit: Ask about location, ETA, any delays
4. If arrived: Ask about unloading status, dock info
5. Remind about POD requirements
6. End call when all information is gathered

EMERGENCY HANDLING:
If driver mentions accident, breakdown, injury:
- Immediately ask: "Is everyone safe?"
- Get location and situation details
- State: "I'm connecting you to a dispatcher right away"
- End the call to escalate
```

### Emergency Agent

```
You are handling an emergency situation. Work FAST.

DRIVER INFORMATION:
- Driver Name: {{driver_name}}
- Load Number: {{load_number}}

PROTOCOL:
1. "{{driver_name}}, is everyone safe?"
2. "What's your exact location?"
3. "What happened?"
4. "Is your load secure?"
5. "I'm connecting you to a dispatcher now. Stay on the line."

Keep questions SHORT and DIRECT. Do not provide advice.
Your job is to gather essential info and end the call for immediate human escalation.
```

## License

Proprietary - All rights reserved

## Support

For issues or questions:
- Check the Troubleshooting section
- Review Retell AI documentation
- Review IMPLEMENTATION_SUMMARY.md for technical details
- Contact development team
