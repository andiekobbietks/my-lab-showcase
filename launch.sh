#!/bin/bash
echo "🚀 Launching My Lab Showcase Local Environment..."
echo "📦 Checking dependencies..."
npm install
echo "⚡ Starting development server..."
# Open browser based on OS
if [[ "$OSTYPE" == "darwin"* ]]; then
  open http://localhost:8080
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
  xdg-open http://localhost:8080
fi
npm run dev
