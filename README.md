# AI Voice Agent Tool

A comprehensive web application for managing AI voice agents and conducting browser-based voice calls using Retell AI. Built for non-technical administrators to configure, test, and review adaptive AI voice agent calls for logistics operations.

## Features

- **Agent Configuration**: Create and manage AI voice agents with customizable system prompts and conversation settings
- **Web-Based Calls**: Initiate voice calls directly from the browser (no phone required)
- **Real-time Call Controls**: Mute/unmute, end call, and monitor call duration
- **Structured Data Extraction**: Automatically extract and display key information from call transcripts using LLM
- **Call History**: Browse and analyze past calls with full transcripts and structured results
- **Two Scenario Types**:
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
- **Retell Web SDK**: Browser-based voice calling
- **Axios**: HTTP client

## Project Structure

```
ai-voice-agent-tool/
├── backend/
│   ├── app/
│   │   ├── models/          # Pydantic data models
│   │   ├── services/        # Business logic (Supabase, Retell, LLM)
│   │   ├── routers/         # API endpoints
│   │   ├── utils/           # Helper utilities
│   │   ├── config.py        # Settings management
│   │   └── main.py          # FastAPI app
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── pages/           # Page components
│   │   ├── services/        # API client
│   │   └── types/           # TypeScript types
│   ├── package.json
│   └── .env.example
├── database_schema.sql      # Database setup
└── README.md
```

## Setup Instructions

### Prerequisites

- Python 3.9+
- Node.js 18+
- Supabase account (free tier works)
- Retell AI account (with web call capabilities)
- Anthropic API key (or OpenAI)

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

### 4. Retell AI Webhook Configuration

1. Log in to [Retell AI Dashboard](https://beta.retellai.com)
2. Go to Settings > Webhooks
3. Add your webhook URL: `https://your-domain.com/api/webhooks/retell`
4. For local development, use [ngrok](https://ngrok.com):
   ```bash
   ngrok http 8000
   # Use the ngrok URL + /api/webhooks/retell
   ```

## Usage Guide

### Creating an Agent

1. Navigate to **Agent Configuration** page
2. Click **Create New Agent**
3. Fill in the form:
   - **Name**: Descriptive name (e.g., "Driver Check-in Agent")
   - **Description**: Optional brief description
   - **Scenario Type**: Choose "check_in" or "emergency"
   - **System Prompt**: Define the agent's behavior and conversation flow
   - **Conversation Settings**:
     - Enable/disable backchannel (uh-huh, yeah)
     - Adjust backchannel frequency (0-1)
     - Enable/disable filler words
     - Set interruption sensitivity (0-1, higher = more interruptible)
     - Set responsiveness (0-1, higher = faster responses)
     - Select voice ID
4. Click **Create Agent**

The agent will be automatically created in Retell AI.

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

### Viewing Call Results

1. Navigate to **Call History**
2. Select a call from the list
3. View:
   - **Call Metadata**: Driver name, load number, duration, timestamps
   - **Structured Data**: Key information extracted from the conversation
   - **Full Transcript**: Complete conversation with speaker labels

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
- `GET /api/agents/` - List agents
- `GET /api/agents/{id}` - Get agent
- `PUT /api/agents/{id}` - Update agent
- `DELETE /api/agents/{id}` - Delete agent

### Calls
- `POST /api/calls/web-call` - Create web call (returns access token)
- `GET /api/calls/` - List calls
- `GET /api/calls/{id}` - Get call details
- `DELETE /api/calls/{id}` - Delete call

### Webhooks
- `POST /api/webhooks/retell` - Retell AI webhook handler

### Health
- `GET /health` - Health check

## Environment Variables

### Backend (.env)

```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-supabase-anon-key

# Retell AI
RETELL_API_KEY=your-retell-api-key

# LLM (choose one)
ANTHROPIC_API_KEY=your-anthropic-key
# OPENAI_API_KEY=your-openai-key

# Application
ENVIRONMENT=development
DEBUG=true
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
```

### Frontend (.env)

```env
VITE_API_BASE_URL=http://localhost:8000/api
```

## Troubleshooting

### Backend Issues

**Error: "No LLM API key configured"**
- Ensure `ANTHROPIC_API_KEY` or `OPENAI_API_KEY` is set in backend `.env`

**Error: "Failed to connect to Supabase"**
- Verify `SUPABASE_URL` and `SUPABASE_KEY` are correct
- Check that database schema has been run

**Error: "Retell agent creation failed"**
- Verify `RETELL_API_KEY` is valid
- Check Retell AI dashboard for API errors

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

## Development

### Running Tests

Backend:
```bash
cd backend
pytest
```

Frontend:
```bash
cd frontend
npm run test
```

### Building for Production

Backend:
```bash
cd backend
# Use a production WSGI server
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker
```

Frontend:
```bash
cd frontend
npm run build
# Serve the dist/ folder with a web server
```

## Security Notes

- Never commit `.env` files
- Use environment variables for all secrets
- Enable HTTPS in production
- Restrict CORS origins in production
- Use Supabase Row Level Security (RLS) policies
- Rotate API keys regularly

## Sample System Prompts

### Check-in Agent

```
You are a professional dispatch assistant calling to check in with a truck driver.

Your goal is to gather status information through natural conversation.

CONVERSATION FLOW:
1. Greeting: "Hi [driver name], this is dispatch calling about load [load number]. Can you give me an update?"
2. Listen and adapt based on their response
3. If in transit: Ask about location, ETA, any delays
4. If arrived: Ask about unloading status, dock info
5. Remind about POD requirements

EMERGENCY HANDLING:
If driver mentions accident, breakdown, injury:
- Immediately ask: "Is everyone safe?"
- Get location and situation details
- State: "I'm connecting you to a dispatcher right away"
```

### Emergency Agent

```
You are handling an emergency situation. Work FAST.

PROTOCOL:
1. "Is everyone safe?"
2. "What's your exact location?"
3. "What happened?"
4. "Is your load secure?"
5. "I'm connecting you to a dispatcher now. Stay on the line."

Keep questions SHORT and DIRECT. Do not provide advice.
Your job is to gather essential info and escalate IMMEDIATELY.
```

## License

Proprietary - All rights reserved

## Support

For issues or questions:
- Check the Troubleshooting section
- Review Retell AI documentation
- Contact development team
