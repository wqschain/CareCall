#!/bin/bash

# Get the current IP address (excluding localhost)
CURRENT_IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -n 1)

echo "Your current IP is: $CURRENT_IP"
echo "To update Vercel:"
echo "1. Go to https://vercel.com/wqschain/carecall/settings/environment-variables"
echo "2. Update BACKEND_URL to: http://$CURRENT_IP:8080"
echo ""
echo "After updating, redeploy your Vercel project" 