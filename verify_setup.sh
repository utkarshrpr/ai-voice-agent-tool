#!/bin/bash

# AI Voice Agent Tool - Setup Verification Script
# Run this script to verify all files are in place

echo "==================================="
echo "AI Voice Agent Tool - Setup Verification"
echo "==================================="
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

success_count=0
fail_count=0

# Function to check file exists
check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✓${NC} $1"
        ((success_count++))
    else
        echo -e "${RED}✗${NC} $1 (MISSING)"
        ((fail_count++))
    fi
}

# Function to check directory exists
check_dir() {
    if [ -d "$1" ]; then
        echo -e "${GREEN}✓${NC} $1/"
        ((success_count++))
    else
        echo -e "${RED}✗${NC} $1/ (MISSING)"
        ((fail_count++))
    fi
}

echo "Checking root files..."
check_file ".gitignore"
check_file "README.md"
check_file "QUICKSTART.md"
check_file "IMPLEMENTATION_SUMMARY.md"
check_file "database_schema.sql"
check_file "problem.md"
echo ""

echo "Checking backend structure..."
check_dir "backend"
check_file "backend/.env.example"
check_file "backend/requirements.txt"
check_dir "backend/app"
check_file "backend/app/__init__.py"
check_file "backend/app/main.py"
check_file "backend/app/config.py"
echo ""

echo "Checking backend models..."
check_dir "backend/app/models"
check_file "backend/app/models/__init__.py"
check_file "backend/app/models/agent_config.py"
check_file "backend/app/models/call.py"
check_file "backend/app/models/structured_data.py"
echo ""

echo "Checking backend services..."
check_dir "backend/app/services"
check_file "backend/app/services/__init__.py"
check_file "backend/app/services/supabase_service.py"
check_file "backend/app/services/retell_service.py"
check_file "backend/app/services/llm_service.py"
echo ""

echo "Checking backend routers..."
check_dir "backend/app/routers"
check_file "backend/app/routers/__init__.py"
check_file "backend/app/routers/agent_config.py"
check_file "backend/app/routers/calls.py"
check_file "backend/app/routers/webhooks.py"
echo ""

echo "Checking backend utils..."
check_dir "backend/app/utils"
check_file "backend/app/utils/__init__.py"
check_file "backend/app/utils/transcript_processor.py"
check_file "backend/app/utils/conversation_manager.py"
echo ""

echo "Checking frontend structure..."
check_dir "frontend"
check_file "frontend/.env.example"
check_file "frontend/package.json"
check_file "frontend/tsconfig.json"
check_file "frontend/tsconfig.node.json"
check_file "frontend/vite.config.ts"
check_file "frontend/tailwind.config.js"
check_file "frontend/postcss.config.js"
check_file "frontend/index.html"
echo ""

echo "Checking frontend source..."
check_dir "frontend/src"
check_file "frontend/src/main.tsx"
check_file "frontend/src/App.tsx"
check_file "frontend/src/index.css"
echo ""

echo "Checking frontend types and services..."
check_dir "frontend/src/types"
check_file "frontend/src/types/index.ts"
check_dir "frontend/src/services"
check_file "frontend/src/services/api.ts"
echo ""

echo "Checking frontend pages..."
check_dir "frontend/src/pages"
check_file "frontend/src/pages/Dashboard.tsx"
check_file "frontend/src/pages/AgentConfiguration.tsx"
check_file "frontend/src/pages/CallHistory.tsx"
echo ""

echo "Checking frontend components..."
check_dir "frontend/src/components"
check_dir "frontend/src/components/AgentConfig"
check_file "frontend/src/components/AgentConfig/AgentConfigForm.tsx"
check_dir "frontend/src/components/CallTrigger"
check_file "frontend/src/components/CallTrigger/CallTriggerForm.tsx"
check_file "frontend/src/components/CallTrigger/CallStatusIndicator.tsx"
check_dir "frontend/src/components/CallResults"
check_file "frontend/src/components/CallResults/CallResultsView.tsx"
check_file "frontend/src/components/CallResults/StructuredDataDisplay.tsx"
check_file "frontend/src/components/CallResults/TranscriptDisplay.tsx"
echo ""

echo "==================================="
echo "Verification Complete"
echo "==================================="
echo -e "${GREEN}✓ Success: $success_count files/directories${NC}"
if [ $fail_count -gt 0 ]; then
    echo -e "${RED}✗ Missing: $fail_count files/directories${NC}"
    echo ""
    echo -e "${YELLOW}Some files are missing! Please check the implementation.${NC}"
    exit 1
else
    echo -e "${RED}✗ Missing: 0 files/directories${NC}"
    echo ""
    echo -e "${GREEN}All files are in place!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Follow QUICKSTART.md for setup"
    echo "2. Set up Supabase database"
    echo "3. Get API keys (Retell AI, Anthropic)"
    echo "4. Configure .env files"
    echo "5. Install dependencies and run the app"
    exit 0
fi
