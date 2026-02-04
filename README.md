# AI Voice Agent Tool - MVP

A web application for non-technical administrators to configure, test, and review calls made by an AI voice agent for logistics management. The system integrates with Retell AI for voice capabilities and handles driver check-ins and emergency escalations.

## Features

- **Agent Configuration**: Create and manage AI voice agent configurations with custom prompts and conversation settings
- **Test Call Triggering**: Initiate test calls to drivers with contextual information
- **Real-time Call Monitoring**: Track call status in real-time
- **Structured Data Extraction**: Automatically extract structured data from call transcripts
- **Call History**: View and analyze past call records with full transcripts and extracted data
- **Two Scenarios**:
  - Driver Check-in: Track delivery progress and ETAs
  - Emergency Protocol: Handle urgent situations with safety-first approach

## Tech Stack

- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: FastAPI (Python)
- **Database**: Supabase (PostgreSQL)
- **Voice AI**: Retell AI
- **LLM**: Anthropic Claude / OpenAI GPT-4

## Project Structure

```
ai-voice-agent-tool/
├── backend/              # FastAPI backend
│   ├── app/
│   │   ├── models/       # Pydantic models
│   │   ├── services/     # Business logic services
│   │   ├── routers/      # API endpoints
│   │   ├── utils/        # Utility functions
│   │   └── main.py       # FastAPI app
│   └── requirements.txt
├── frontend/             # React frontend
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── pages/        # Page components
│   │   ├── services/     # API client
│   │   └── types/        # TypeScript types
│   └── package.json
└── database_schema.sql   # Supabase database schema
```

## Setup Instructions

### Prerequisites

- Python 3.9+
- Node.js 18+
- Supabase account
- Retell AI account
- Anthropic API key or OpenAI API key

### 1. Database Setup

1. Create a new project in [Supabase](https://supabase.com)
2. Run the SQL schema from `database_schema.sql` in the Supabase SQL Editor
3. Note your Supabase URL and anon key

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env

# Edit .env with your credentials
# SUPABASE_URL=your_supabase_url
# SUPABASE_KEY=your_supabase_anon_key
# RETELL_API_KEY=your_retell_api_key
# ANTHROPIC_API_KEY=your_anthropic_api_key
# LLM_PROVIDER=anthropic

# Run the backend
uvicorn app.main:app --reload
```

Backend will be available at http://localhost:8000

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env with backend URL
# VITE_API_BASE_URL=http://localhost:8000

# Run the frontend
npm run dev
```

Frontend will be available at http://localhost:5173

## Environment Variables

### Backend (.env)

```env
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
RETELL_API_KEY=your_retell_api_key
OPENAI_API_KEY=your_openai_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key
BACKEND_URL=http://localhost:8000
FRONTEND_URL=http://localhost:5173
LLM_PROVIDER=anthropic  # or "openai"
```

### Frontend (.env)

```env
VITE_API_BASE_URL=http://localhost:8000
```

## API Endpoints

### Agent Configuration

- `POST /api/agent-configs` - Create new agent configuration
- `GET /api/agent-configs` - List all configurations
- `GET /api/agent-configs/{id}` - Get specific configuration
- `PUT /api/agent-configs/{id}` - Update configuration
- `DELETE /api/agent-configs/{id}` - Delete configuration

### Calls

- `POST /api/calls` - Initiate a new call
- `GET /api/calls` - List all calls (with pagination)
- `GET /api/calls/{id}` - Get call details
- `WS /api/calls/ws/{call_id}` - WebSocket for real-time call updates

### Webhooks

- `POST /api/webhooks/retell` - Webhook for Retell AI events

## Usage Guide

### 1. Configure an Agent

1. Navigate to "Agent Configs" page
2. Click "Create New Config"
3. Fill in:
   - Name (e.g., "Driver Check-in Agent")
   - Description
   - System Prompt (instructions for the AI)
   - Scenario Type (check_in or emergency)
4. Save the configuration

### 2. Trigger a Test Call

1. Go to Dashboard
2. Select an agent configuration
3. Enter driver information:
   - Driver name
   - Phone number
   - Load number
4. Click "Start Test Call"

### 3. Monitor Call Progress

- Real-time status indicator shows call progress
- Status updates every 2 seconds
- View structured data once call completes

### 4. Review Call History

1. Navigate to "Call History" page
2. Browse all past calls
3. Click any call to view:
   - Call metadata
   - Structured extracted data
   - Full conversation transcript

## Database Schema

### agent_configs
- Configuration for AI voice agents
- Includes system prompts and conversation settings
- Supports multiple scenario types

### calls
- Records of all phone calls
- Links to agent configuration
- Stores transcripts and structured data

### call_events
- Event log for each call
- Tracks status changes and events
- Useful for debugging and analytics

## Scenarios

### Scenario 1: Driver Check-in

Collects:
- Driver status (in-transit, arrived, unloading, completed)
- Current location
- ETA
- Delay reasons (if any)
- Unloading status
- POD reminder acknowledgment

### Scenario 2: Emergency Protocol

Collects:
- Emergency type (accident, breakdown, medical, tire_blowout, other)
- Safety status
- Injury status
- Emergency location
- Load security status
- Escalation confirmation

## Development

### Backend Development

```bash
# Run with auto-reload
uvicorn app.main:app --reload --port 8000

# Run tests (when implemented)
pytest
```

### Frontend Development

```bash
# Run dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Troubleshooting

### Backend Issues

- **Database connection errors**: Verify Supabase credentials in .env
- **Retell AI errors**: Check API key and ensure webhook URL is accessible
- **LLM errors**: Verify Anthropic/OpenAI API keys

### Frontend Issues

- **API connection errors**: Ensure backend is running and VITE_API_BASE_URL is correct
- **Build errors**: Clear node_modules and reinstall dependencies

## Future Enhancements

- User authentication and authorization
- Advanced call analytics and reporting
- Integration with GPS tracking systems
- SMS notifications
- Voice recording playback
- A/B testing for agent configurations
- Export functionality (CSV, PDF)
- Multi-language support

## License

MIT

## Support

For issues and questions, please open an issue on GitHub.
