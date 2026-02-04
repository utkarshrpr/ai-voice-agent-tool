#!/bin/bash

echo "=================================="
echo "AI Voice Agent Tool - Setup Verification"
echo "=================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✓${NC} $1"
        return 0
    else
        echo -e "${RED}✗${NC} $1 (missing)"
        return 1
    fi
}

check_directory() {
    if [ -d "$1" ]; then
        echo -e "${GREEN}✓${NC} $1/"
        return 0
    else
        echo -e "${RED}✗${NC} $1/ (missing)"
        return 1
    fi
}

echo "Checking Backend Structure..."
echo "------------------------------"
check_directory "backend/app"
check_directory "backend/app/models"
check_directory "backend/app/services"
check_directory "backend/app/routers"
check_directory "backend/app/utils"
check_file "backend/app/main.py"
check_file "backend/app/config.py"
check_file "backend/requirements.txt"
check_file "backend/.env.example"
echo ""

echo "Checking Frontend Structure..."
echo "------------------------------"
check_directory "frontend/src"
check_directory "frontend/src/components"
check_directory "frontend/src/pages"
check_directory "frontend/src/services"
check_directory "frontend/src/types"
check_file "frontend/package.json"
check_file "frontend/vite.config.ts"
check_file "frontend/tailwind.config.js"
check_file "frontend/.env.example"
echo ""

echo "Checking Documentation..."
echo "-------------------------"
check_file "README.md"
check_file "IMPLEMENTATION_SUMMARY.md"
check_file "database_schema.sql"
check_file ".gitignore"
echo ""

echo "Checking Python Dependencies..."
echo "-------------------------------"
if [ -d "backend/venv" ]; then
    echo -e "${GREEN}✓${NC} Virtual environment exists"
else
    echo -e "${YELLOW}⚠${NC} Virtual environment not found. Run: cd backend && python -m venv venv"
fi
echo ""

echo "Checking Node Dependencies..."
echo "-----------------------------"
if [ -d "frontend/node_modules" ]; then
    echo -e "${GREEN}✓${NC} Node modules installed"
else
    echo -e "${YELLOW}⚠${NC} Node modules not found. Run: cd frontend && npm install"
fi
echo ""

echo "Checking Environment Files..."
echo "-----------------------------"
if [ -f "backend/.env" ]; then
    echo -e "${GREEN}✓${NC} Backend .env file exists"
else
    echo -e "${YELLOW}⚠${NC} Backend .env not found. Copy from .env.example and configure"
fi

if [ -f "frontend/.env" ]; then
    echo -e "${GREEN}✓${NC} Frontend .env file exists"
else
    echo -e "${YELLOW}⚠${NC} Frontend .env not found. Copy from .env.example and configure"
fi
echo ""

echo "=================================="
echo "Setup Verification Complete!"
echo "=================================="
echo ""
echo "Next Steps:"
echo "1. Set up Supabase database using database_schema.sql"
echo "2. Configure backend/.env with your API keys"
echo "3. Configure frontend/.env with backend URL"
echo "4. Install dependencies if not already installed"
echo "5. Run backend: cd backend && uvicorn app.main:app --reload"
echo "6. Run frontend: cd frontend && npm run dev"
echo ""
