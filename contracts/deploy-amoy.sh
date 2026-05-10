#!/bin/bash
# PlokyResolver Deploy Script for Amoy Testnet
# Run this on your Hetzner server or local machine

set -e

echo "=========================================="
echo "  PlokyResolver Deploy to Amoy Testnet"
echo "=========================================="
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ .env file not found!"
    echo ""
    echo "Create .env with your private key:"
    echo "  PRIVATE_KEY=your_66_char_private_key_here"
    echo ""
    exit 1
fi

# Check if PRIVATE_KEY is set
source .env
if [ -z "$PRIVATE_KEY" ] || [ "$PRIVATE_KEY" = "your_private_key_here" ]; then
    echo "❌ PRIVATE_KEY not set in .env!"
    echo ""
    echo "1. Edit .env: nano .env"
    echo "2. Set: PRIVATE_KEY=0x... (your 66-char private key)"
    echo "3. Save and run this script again"
    echo ""
    exit 1
fi

# Validate key length
KEY_LEN=${#PRIVATE_KEY}
if [ "$KEY_LEN" -ne 66 ]; then
    echo "⚠️  WARNING: Private key is $KEY_LEN chars (expected 66)"
    echo "   Make sure you're using the private key, not the address!"
    echo "   Address = 42 chars (0x + 40 hex)"
    echo "   Private key = 66 chars (0x + 64 hex)"
    echo ""
    read -p "Continue anyway? (y/N): " confirm
    if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
        exit 1
    fi
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Compile
echo "🔨 Compiling contracts..."
npx hardhat compile

# Deploy
echo ""
echo "🚀 Deploying to Amoy testnet..."
echo "Address: $PRIVATE_KEY"
echo ""
npx hardhat run scripts/deploy-open-source.ts --network amoy

echo ""
echo "=========================================="
echo "  ✅ Deploy complete!"
echo "=========================================="
echo ""
echo "Check deployments/latest.json for contract addresses"
