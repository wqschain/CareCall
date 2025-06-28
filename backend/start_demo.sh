#!/bin/bash

echo "Starting CareCall Demo Setup..."

# Activate virtual environment if it exists
if [ -d "venv" ]; then
    source venv/bin/activate
fi

# Check if uvicorn is already running
if pgrep -f "uvicorn main:app" > /dev/null; then
    echo "✓ Backend is already running"
else
    echo "Starting backend server..."
    uvicorn main:app --reload --host 0.0.0.0 --port 8080 &
    sleep 2
    if pgrep -f "uvicorn main:app" > /dev/null; then
        echo "✓ Backend started successfully"
    else
        echo "❌ Failed to start backend"
        exit 1
    fi
fi

# Get and display the current IP
CURRENT_IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -n 1)

# Verify database connection
echo "Verifying database connection..."
DB_HEALTH=$(curl -s http://$CURRENT_IP:8080/health)
if [[ $DB_HEALTH == *"connected"* ]]; then
    echo "✓ Database connection successful"
else
    echo "❌ Warning: Database connection issue. Check your configuration."
fi

echo ""
echo "Your backend is running at: http://$CURRENT_IP:8080"
echo ""
echo "Important steps for demo:"
echo "1. Go to https://vercel.com/wqschain/carecall/settings/environment-variables"
echo "2. Update BACKEND_URL to: http://$CURRENT_IP:8080"
echo "3. Redeploy your Vercel project"
echo ""
echo "To verify setup:"
echo "1. Backend API docs: http://$CURRENT_IP:8080/docs"
echo "2. Frontend (after Vercel update): https://carecall.vercel.app"
echo ""
echo "To stop the backend server: pkill -f 'uvicorn main:app'" 