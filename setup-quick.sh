#!/bin/bash

# VidScript Pro - Quick Setup Script
# This script provides an interactive setup wizard

set -e

# Colors
BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_header() {
    echo -e "${BLUE}"
    echo "═══════════════════════════════════════════════════════════════"
    echo "            VidScript Pro - Quick Setup Wizard"
    echo "═══════════════════════════════════════════════════════════════"
    echo -e "${NC}"
}

print_header

echo "This wizard will help you set up VidScript Pro quickly."
echo ""

# Function to update Supabase config
update_supabase_config() {
    echo -e "${BLUE}Step 1: Supabase Configuration${NC}"
    echo "Please provide your Supabase credentials:"
    echo ""
    
    read -p "Supabase URL: " SUPABASE_URL
    read -p "Supabase Anon Key: " SUPABASE_ANON_KEY
    read -p "Supabase Service Key (for backend): " SUPABASE_SERVICE_KEY
    
    # Update frontend config
    sed -i '' "s|YOUR_SUPABASE_URL|$SUPABASE_URL|g" frontend/lib/supabase.ts
    sed -i '' "s|YOUR_SUPABASE_ANON_KEY|$SUPABASE_ANON_KEY|g" frontend/lib/supabase.ts
    
    # Create backend .env
    cat > backend/.env << EOF
SUPABASE_URL=$SUPABASE_URL
SUPABASE_SERVICE_KEY=$SUPABASE_SERVICE_KEY
OPENAI_API_KEY=
EOF
    
    echo -e "${GREEN}✓ Supabase configuration updated${NC}"
    echo ""
}

# Function to update OpenAI config
update_openai_config() {
    echo -e "${BLUE}Step 2: OpenAI Configuration${NC}"
    echo "Please provide your OpenAI API key:"
    echo ""
    
    read -p "OpenAI API Key: " OPENAI_API_KEY
    
    # Update backend .env
    sed -i '' "s|OPENAI_API_KEY=|OPENAI_API_KEY=$OPENAI_API_KEY|g" backend/.env
    
    echo -e "${GREEN}✓ OpenAI configuration updated${NC}"
    echo ""
}

# Function to show next steps
show_next_steps() {
    echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}Configuration completed successfully!${NC}"
    echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Go to your Supabase dashboard"
    echo "2. Run the SQL script from database/schema.sql"
    echo "3. Run: ${YELLOW}./run.sh${NC} to start the application"
    echo ""
    echo "The application will be available at:"
    echo "  Frontend: ${GREEN}http://localhost:3000${NC}"
    echo "  Backend:  ${GREEN}http://localhost:8000${NC}"
    echo ""
}

# Check if we're in the right directory
if [ ! -f "package.json" ] && [ ! -d "frontend" ]; then
    echo -e "${RED}Error: Please run this script from the project root directory${NC}"
    exit 1
fi

# Run setup steps
update_supabase_config
update_openai_config
show_next_steps