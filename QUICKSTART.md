# Quick Start Guide

Get the AI Voice Agent Tool running in 10 minutes.

## Prerequisites Check

```bash
python --version  # Should be 3.9+
node --version    # Should be 18+
```

## Step 1: Clone and Setup (1 min)

```bash
cd "ai-voice-agent-tool"
```

## Step 2: Database Setup (2 min)

1. Go to https://supabase.com and create a free account
2. Create a new project
3. Go to SQL Editor
4. Copy and paste the contents of `database_schema.sql`
5. Click "Run"
6. Go to Project Settings > API and note:
   - Project URL
   - anon/public key

## Step 3: Get API Keys (2 min)

1. **Retell AI**: https://beta.retellai.com
   - Sign up and get API key
   - Ensure your plan includes web call capabilities

2. **Anthropic**: https://console.anthropic.com
   - Get API key for Claude

## Step 4: Backend Setup (2 min)

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env

# Edit .env with your keys:
# SUPABASE_URL=your-supabase-url
# SUPABASE_KEY=your-supabase-key
# RETELL_API_KEY=your-retell-key
# ANTHROPIC_API_KEY=your-anthropic-key
```

Use your favorite text editor to update the `.env` file.

## Step 5: Start Backend (1 min)

```bash
# Make sure you're in backend/ directory with venv activated
uvicorn app.main:app --reload
```

Leave this terminal running. You should see:
```
INFO:     Application startup complete.
INFO:     Uvicorn running on http://127.0.0.1:8000
```

Test it: Open http://localhost:8000/health in your browser

## Step 6: Frontend Setup (2 min)

Open a NEW terminal:

```bash
cd frontend

# Install dependencies
npm install

# Create .env file
cp .env.example .env
# The default values should work for local development

# Start development server
npm run dev
```

You should see:
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
```

## Step 7: Open the App

Open http://localhost:5173 in your browser

## Step 8: Create Your First Agent

1. Click "Agent Configuration" in the navigation
2. Click "Create New Agent"
3. Fill in:
   - Name: "Test Agent"
   - Scenario Type: "check_in"
   - System Prompt: Use the sample from README.md or write your own
4. Click "Create Agent"

Wait a few seconds for the agent to be created in Retell AI.

## Step 9: Make Your First Call

1. Go back to "Dashboard"
2. Select your agent
3. Fill in:
   - Driver Name: "Test Driver"
   - Load Number: "TEST-001"
4. Click "Start Web Call"
5. Allow microphone permissions
6. Speak to the agent!

## Troubleshooting

**Backend won't start**
- Check all environment variables are set
- Make sure database schema was run successfully
- Verify API keys are valid

**Frontend can't connect**
- Make sure backend is running on port 8000
- Check browser console for errors
- Verify CORS settings

**Call won't start**
- Check Retell API key is valid
- Ensure agent was created successfully (check backend logs)
- Allow microphone permissions in browser

**No structured data after call**
- Wait 10-20 seconds for processing
- Check backend logs for LLM errors
- Verify Anthropic API key is valid

## Next Steps

- Read the full README.md for detailed documentation
- Configure webhook for production (see README.md)
- Customize system prompts for your use case
- Test emergency scenarios
- Review call history and transcripts

## Quick Commands Reference

```bash
# Start backend
cd backend && source venv/bin/activate && uvicorn app.main:app --reload

# Start frontend
cd frontend && npm run dev

# Install backend dependencies
cd backend && pip install -r requirements.txt

# Install frontend dependencies
cd frontend && npm install

# Build frontend for production
cd frontend && npm run build
```

## Support

If you get stuck:
1. Check the Troubleshooting section in README.md
2. Review browser console and backend logs
3. Verify all API keys are correct
4. Ensure Supabase database is properly configured
