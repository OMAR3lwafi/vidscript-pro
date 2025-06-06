#!/bin/bash

# VidScript Pro - Stop Script
# This script stops all running VidScript Pro services

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

echo -e "${BLUE}Stopping VidScript Pro services...${NC}"

# Kill processes on port 3000 (frontend)
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null ; then
    print_status "Stopping frontend on port 3000..."
    lsof -ti:3000 | xargs kill -9 2>/dev/null
    print_success "Frontend stopped"
else
    print_status "Frontend not running on port 3000"
fi

# Kill processes on port 8000 (backend)
if lsof -Pi :8000 -sTCP:LISTEN -t >/dev/null ; then
    print_status "Stopping backend on port 8000..."
    lsof -ti:8000 | xargs kill -9 2>/dev/null
    print_success "Backend stopped"
else
    print_status "Backend not running on port 8000"
fi

# Kill any remaining node and python processes related to the app
print_status "Cleaning up any remaining processes..."
pkill -f "next dev" 2>/dev/null || true
pkill -f "uvicorn main:app" 2>/dev/null || true

print_success "All VidScript Pro services have been stopped"