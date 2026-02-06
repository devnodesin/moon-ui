#!/usr/bin/env bash
# Setup script for Moon Admin WebApp
# This script initializes the project using Bun.js

set -e

echo "🌙 Moon Admin WebApp - Project Setup"
echo "======================================"
echo ""

# Check if Bun is installed
if ! command -v bun &> /dev/null; then
    echo "❌ Bun is not installed. Please install it first:"
    echo "   curl -fsSL https://bun.sh/install | bash"
    exit 1
fi

echo "✅ Bun $(bun --version) detected"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
bun install

echo ""
echo "✅ Setup complete!"
echo ""
echo "Available commands:"
echo "  bun run dev      - Start development server"
echo "  bun run build    - Build for production"
echo "  bun test         - Run tests"
echo "  bun run lint     - Run linter"
echo "  bun run format   - Format code"
echo ""
