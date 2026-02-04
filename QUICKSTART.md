# Quick Start Guide

Get the AI Voice Agent Tool running in 5 minutes!

## Prerequisites

- Python 3.9+
- Node.js 18+
- Supabase account (free tier works)
- Retell AI account
- Anthropic or OpenAI API key

## Step 1: Database Setup (2 minutes)

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the project to be ready
3. Go to SQL Editor in your Supabase dashboard
4. Copy the entire contents of `database_schema.sql`
5. Paste and run in the SQL Editor
6. Note your project URL and anon key from Settings > API

## Step 2: Backend Setup (2 minutes)

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On macOS/Linux:
source venv/bin/activate
# On Windows:
# venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env

# Edit .env file with your credentials:
# SUPABASE_URL=https://your-project.supabase.co
# SUPABASE_KEY=your-anon-key
# RETELL_API_KEY=your-retell-key
# ANTHROPIC_API_KEY=your-anthropic-key
# LLM_PROVIDER=anthropic
```

## Step 3: Frontend Setup (1 minute)

```bash
# Open a new terminal
cd frontend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# The default values should work:
# VITE_API_BASE_URL=http://localhost:8000
```

## Step 4: Run the Application

### Terminal 1 - Backend
```bash
cd backend
source venv/bin/activate  # if not already activated
uvicorn app.main:app --reload
```

Backend will start at: http://localhost:8000

### Terminal 2 - Frontend
```bash
cd frontend
npm run dev
```

Frontend will start at: http://localhost:5173

## Step 5: Verify Everything Works

1. Open http://localhost:5173 in your browser
2. You should see the AI Voice Agent Tool dashboard
3. Navigate to "Agent Configs" - you should see 2 pre-configured agents
4. Go back to Dashboard to trigger a test call

## Test Your First Call

1. On the Dashboard page:
   - Select "Driver Check-in Agent" from the dropdown
   - Enter test driver information:
     - Name: John Doe
     - Phone: +1234567890 (use your actual test number)
     - Load: LD-12345
   - Click "Start Test Call"

2. The system will:
   - Create a call record
   - Initiate the call via Retell AI
   - Show real-time status
   - Display results when complete

## Troubleshooting

### Backend won't start
- Check that all environment variables in `backend/.env` are set
- Verify Python version: `python --version` (should be 3.9+)
- Check Supabase credentials are correct

### Frontend won't start
- Check Node version: `node --version` (should be 18+)
- Try deleting `node_modules` and running `npm install` again
- Verify backend is running at http://localhost:8000

### Database errors
- Make sure you ran the entire `database_schema.sql` file
- Check Supabase project is not paused
- Verify SUPABASE_URL and SUPABASE_KEY are correct

### Retell AI errors
- Verify your Retell API key is valid
- Check you have phone number configured in Retell dashboard
- Ensure webhook URL is accessible (use ngrok for local testing)

## Using ngrok for Webhooks (Development)

Retell AI needs to send webhooks to your backend. For local development:

```bash
# Install ngrok
brew install ngrok  # macOS
# or download from ngrok.com

# Create tunnel to your backend
ngrok http 8000

# Copy the HTTPS URL (e.g., https://abc123.ngrok.io)
# Update backend/.env:
# BACKEND_URL=https://abc123.ngrok.io

# Restart backend server
```

## Next Steps

1. **Create Custom Agent**
   - Go to "Agent Configs"
   - Click "Create New Config"
   - Customize the system prompt
   - Save and test

2. **Review Call History**
   - Go to "Call History"
   - Click on any completed call
   - View transcript and extracted data

3. **Test Emergency Scenario**
   - Select "Emergency Protocol Agent"
   - During call, say "emergency" or "accident"
   - Watch the agent pivot to safety questions

## Production Deployment

For production deployment, see the full README.md for:
- Cloud deployment options
- Environment configuration
- Security considerations
- Monitoring and logging

## Getting Help

- Check README.md for detailed documentation
- Review IMPLEMENTATION_SUMMARY.md for architecture details
- Check the database_schema.sql for data structure
- Review backend logs for error details
- Check browser console for frontend errors

## Sample Prompts for Testing

### Check-in Scenario
- "I'm still on the highway, about 30 minutes out"
- "I just arrived at the warehouse"
- "I'm unloading now"
- "There was some traffic, running a bit late"

### Emergency Scenario
- "I had an accident" (triggers emergency protocol)
- "My tire blew out" (triggers emergency protocol)
- "I need help" (triggers emergency protocol)

Enjoy using the AI Voice Agent Tool! 🚀
