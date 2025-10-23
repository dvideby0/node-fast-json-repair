#!/bin/bash
set -e

echo "🔧 Fast JSON Repair - Setup Script"
echo "=================================="
echo ""

# Check for Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 16+ from https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 16 ]; then
    echo "❌ Node.js version 16 or higher is required. Current version: $(node --version)"
    exit 1
fi

echo "✅ Node.js $(node --version) detected"

# Check for Rust
if ! command -v cargo &> /dev/null; then
    echo "⚠️  Rust is not installed. Installing Rust..."
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
    source "$HOME/.cargo/env"
    echo "✅ Rust installed successfully"
else
    echo "✅ Rust $(rustc --version) detected"
fi

# Detect package manager
if command -v pnpm &> /dev/null; then
    PKG_MANAGER="pnpm"
    INSTALL_CMD="pnpm install"
elif command -v yarn &> /dev/null; then
    PKG_MANAGER="yarn"
    INSTALL_CMD="yarn install"
else
    PKG_MANAGER="npm"
    INSTALL_CMD="npm install"
fi

echo "📦 Using package manager: $PKG_MANAGER"
echo ""

# Install dependencies
echo "📥 Installing dependencies..."
$INSTALL_CMD

echo ""
echo "🏗️  Building native module..."
if [ "$PKG_MANAGER" = "pnpm" ]; then
    pnpm run build
elif [ "$PKG_MANAGER" = "yarn" ]; then
    yarn build
else
    npm run build
fi

echo ""
echo "🧪 Running tests..."
if [ "$PKG_MANAGER" = "pnpm" ]; then
    pnpm test
elif [ "$PKG_MANAGER" = "yarn" ]; then
    yarn test
else
    npm test
fi

echo ""
echo "=================================="
echo "✅ Setup complete!"
echo ""
echo "Available commands:"
echo "  $PKG_MANAGER run build        - Build the native module"
echo "  $PKG_MANAGER test              - Run tests"
echo "  $PKG_MANAGER run bench         - Run benchmarks"
echo ""
echo "📚 See README.md for usage examples"

