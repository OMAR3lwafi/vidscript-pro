#!/bin/bash

# VidScript Pro - Setup and Run Script for macOS
# This script sets up and runs both frontend and backend services

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# ASCII Art Banner
echo -e "${BLUE}"
cat << "EOF"
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   ██╗   ██╗██╗██████╗ ███████╗ ██████╗██████╗ ██╗██████╗    ║
║   ██║   ██║██║██╔══██╗██╔════╝██╔════╝██╔══██╗██║██╔══██╗   ║
║   ██║   ██║██║██║  ██║███████╗██║     ██████╔╝██║██████╔╝   ║
║   ╚██╗ ██╔╝██║██║  ██║╚════██║██║     ██╔══██╗██║██╔═══╝    ║
║    ╚████╔╝ ██║██████╔╝███████║╚██████╗██║  ██║██║██║        ║
║     ╚═══╝  ╚═╝╚═════╝ ╚══════╝ ╚═════╝╚═╝  ╚═╝╚═╝╚═╝        ║
║                                                               ║
║              Professional Video Transcription                 ║
╚═══════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

# Check if running on macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
    print_error "This script is designed for macOS. Please use the appropriate script for your OS."
    exit 1
fi

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check and install Homebrew
check_homebrew() {
    if ! command_exists brew; then
        print_warning "Homebrew not found. Installing Homebrew..."
        /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
        print_success "Homebrew installed successfully"
    fi
}

# Function to check and install dependencies
check_dependencies() {
    print_status "Checking dependencies..."
    
    # Check Node.js
    if ! command_exists node; then
        print_warning "Node.js not found. Installing Node.js..."
        brew install node
        print_success "Node.js installed successfully"
    else
        NODE_VERSION=$(node -v)
        print_success "Node.js found: $NODE_VERSION"
    fi
    
    # Check Python
    if ! command_exists python3; then
        print_warning "Python 3 not found. Installing Python..."
        brew install python@3.9
        print_success "Python installed successfully"
    else
        PYTHON_VERSION=$(python3 --version)
        print_success "Python found: $PYTHON_VERSION"
    fi
    
    # Check FFmpeg
    if ! command_exists ffmpeg; then
        print_warning "FFmpeg not found. Installing FFmpeg..."
        brew install ffmpeg
        print_success "FFmpeg installed successfully"
    else
        print_success "FFmpeg found"
    fi
}

# Function to setup frontend
setup_frontend() {
    print_status "Setting up frontend..."
    
    cd frontend
    
    # Check if node_modules exists
    if [ ! -d "node_modules" ]; then
        print_status "Installing frontend dependencies..."
        npm install
        print_success "Frontend dependencies installed"
    else
        print_success "Frontend dependencies already installed"
    fi
    
    # Check if Supabase is configured
    if grep -q "YOUR_SUPABASE_URL" lib/supabase.ts; then
        print_warning "Supabase not configured in frontend/lib/supabase.ts"
        echo "Please update the following values:"
        echo "  - SUPABASE_URL"
        echo "  - SUPABASE_ANON_KEY"
        echo ""
        read -p "Press Enter after updating the configuration..."
    fi
    
    cd ..
}

# Function to setup backend
setup_backend() {
    print_status "Setting up backend..."
    
    cd backend
    
    # Create virtual environment if it doesn't exist
    if [ ! -d "venv" ]; then
        print_status "Creating Python virtual environment..."
        python3 -m venv venv
        print_success "Virtual environment created"
    fi
    
    # Activate virtual environment
    source venv/bin/activate
    
    # Install dependencies
    print_status "Installing backend dependencies..."
    pip install -r requirements.txt
    
    # Check if .env exists
    if [ ! -f ".env" ]; then
        print_status "Creating .env file from template..."
        cp .env.example .env
        print_warning "Please update .env file with your credentials:"
        echo "  - SUPABASE_URL"
        echo "  - SUPABASE_SERVICE_KEY"
        echo "  - OPENAI_API_KEY"
        echo ""
        read -p "Press Enter after updating the .env file..."
    fi
    
    cd ..
}

# Function to check if ports are available
check_ports() {
    print_status "Checking port availability..."
    
    # Check port 3000 (frontend)
    if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null ; then
        print_error "Port 3000 is already in use. Please free it up or change the frontend port."
        read -p "Do you want to kill the process using port 3000? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            kill -9 $(lsof -ti:3000)
            print_success "Port 3000 freed"
        else
            exit 1
        fi
    fi
    
    # Check port 8000 (backend)
    if lsof -Pi :8000 -sTCP:LISTEN -t >/dev/null ; then
        print_error "Port 8000 is already in use. Please free it up or change the backend port."
        read -p "Do you want to kill the process using port 8000? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            kill -9 $(lsof -ti:8000)
            print_success "Port 8000 freed"
        else
            exit 1
        fi
    fi
}

# Function to run services
run_services() {
    print_status "Starting services..."
    
    # Create a temporary file for storing PIDs
    PID_FILE="/tmp/vidscript_pids.txt"
    > "$PID_FILE"
    
    # Start backend
    print_status "Starting backend server..."
    cd backend
    source venv/bin/activate
    uvicorn main:app --reload --host 0.0.0.0 --port 8000 &
    BACKEND_PID=$!
    echo "BACKEND=$BACKEND_PID" >> "$PID_FILE"
    cd ..
    
    # Wait for backend to start
    sleep 3
    
    # Start frontend
    print_status "Starting frontend server..."
    cd frontend
    NEXT_PUBLIC_API_URL=http://localhost:8000 npm run dev &
    FRONTEND_PID=$!
    echo "FRONTEND=$FRONTEND_PID" >> "$PID_FILE"
    cd ..
    
    print_success "Services started successfully!"
    echo ""
    echo "═══════════════════════════════════════════════════════════════"
    echo "  Frontend: ${GREEN}http://localhost:3000${NC}"
    echo "  Backend:  ${GREEN}http://localhost:8000${NC}"
    echo "  API Docs: ${GREEN}http://localhost:8000/docs${NC}"
    echo "═══════════════════════════════════════════════════════════════"
    echo ""
    echo "Press ${RED}Ctrl+C${NC} to stop all services"
    echo ""
    
    # Function to cleanup on exit
    cleanup() {
        echo ""
        print_status "Stopping services..."
        
        # Kill frontend and backend processes
        if [ -n "$FRONTEND_PID" ]; then
            kill $FRONTEND_PID 2>/dev/null
        fi
        if [ -n "$BACKEND_PID" ]; then
            kill $BACKEND_PID 2>/dev/null
        fi
        
        # Kill any remaining processes on the ports
        lsof -ti:3000 | xargs kill -9 2>/dev/null || true
        lsof -ti:8000 | xargs kill -9 2>/dev/null || true
        
        print_success "All services stopped"
        rm -f "$PID_FILE"
        exit 0
    }
    
    # Set trap to cleanup on Ctrl+C
    trap cleanup INT TERM
    
    # Keep script running
    while true; do
        sleep 1
    done
}

# Function to display help
show_help() {
    echo "VidScript Pro - Setup and Run Script"
    echo ""
    echo "Usage: ./run.sh [command]"
    echo ""
    echo "Commands:"
    echo "  setup    - Only run setup (install dependencies)"
    echo "  run      - Only run services (skip setup)"
    echo "  help     - Show this help message"
    echo ""
    echo "If no command is provided, both setup and run will be executed."
}

# Main execution
main() {
    case "${1:-}" in
        setup)
            check_homebrew
            check_dependencies
            setup_frontend
            setup_backend
            print_success "Setup completed successfully!"
            ;;
        run)
            check_ports
            run_services
            ;;
        help)
            show_help
            ;;
        *)
            # Default: run both setup and services
            check_homebrew
            check_dependencies
            setup_frontend
            setup_backend
            check_ports
            run_services
            ;;
    esac
}

# Run main function with all arguments
main "$@"