#!/bin/bash

echo "🛍️ Best Deal Finder - Setup Script"
echo "=================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

echo "✅ Node.js is installed: $(node --version)"

# Check if MongoDB is running (optional)
if ! command -v mongod &> /dev/null; then
    echo "⚠️  MongoDB is not installed locally. You can:"
    echo "   1. Install MongoDB locally"
    echo "   2. Use MongoDB Atlas (cloud)"
    echo "   3. Update MONGODB_URI in server/.env"
fi

# Install Playwright dependencies for Linux
echo "📦 Installing Playwright system dependencies..."
sudo npx playwright install-deps 2>/dev/null || echo "⚠️  Could not install Playwright deps automatically. Run: sudo npx playwright install-deps"

# Check for Gemini API key
if grep -q "your_gemini_api_key_here" server/.env; then
    echo "⚠️  Please update your Gemini API key in server/.env"
    echo "   Get your key from: https://aistudio.google.com/"
fi

echo ""
echo "🚀 Setup complete! To start the application:"
echo ""
echo "Terminal 1 (Backend):"
echo "cd server && npm run dev"
echo ""
echo "Terminal 2 (Frontend):"
echo "cd client && npm run dev"
echo ""
echo "Then visit: http://localhost:5173"
echo ""
echo "📖 See README.md for detailed instructions"
