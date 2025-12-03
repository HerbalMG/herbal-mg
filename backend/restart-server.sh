#!/bin/bash

echo "🔄 Restarting Backend Server..."
echo ""

# Kill any process on port 3001
echo "1️⃣  Stopping any process on port 3001..."
lsof -ti:3001 | xargs kill -9 2>/dev/null && echo "   ✅ Killed process on port 3001" || echo "   ℹ️  No process running on port 3001"

# Kill any node server processes
echo "2️⃣  Stopping any node server processes..."
pkill -f "node.*server" 2>/dev/null && echo "   ✅ Killed node server processes" || echo "   ℹ️  No node server processes found"

# Clear node cache
echo "3️⃣  Clearing node cache..."
rm -rf node_modules/.cache 2>/dev/null && echo "   ✅ Cache cleared" || echo "   ℹ️  No cache to clear"

# Wait a moment
echo "4️⃣  Waiting for cleanup..."
sleep 2

echo ""
echo "✅ Cleanup complete!"
echo ""
echo "Now run: npm start"
echo ""
