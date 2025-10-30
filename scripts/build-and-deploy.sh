#!/bin/bash

# Build and Deploy Script for Dare Betting Platform
echo "🔥 BUILDING AND DEPLOYING DARE BETTING CONTRACTS 🔥"

# Set Solana to localhost for development
echo "Setting Solana to localhost..."
solana config set --url localhost

# Start local validator if not running
echo "Starting local Solana validator..."
solana-test-validator --reset &
VALIDATOR_PID=$!

# Wait for validator to start
sleep 5

# Build the Anchor program
echo "Building Anchor program..."
cd ../programs/dare-betting
anchor build

if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    kill $VALIDATOR_PID
    exit 1
fi

# Deploy the program
echo "Deploying program..."
anchor deploy

if [ $? -ne 0 ]; then
    echo "❌ Deploy failed!"
    kill $VALIDATOR_PID
    exit 1
fi

# Get the program ID
PROGRAM_ID=$(solana address -k target/deploy/dare_betting-keypair.json)
echo "✅ Program deployed successfully!"
echo "📝 Program ID: $PROGRAM_ID"

# Update the frontend with the actual program ID
cd ../../app
echo "Updating frontend with Program ID..."
sed -i "s/11111111111111111111111111111111/$PROGRAM_ID/g" src/hooks/useDareProgram.ts

# Generate TypeScript types
echo "Generating TypeScript types..."
anchor run copy-idl

echo "🎉 DEPLOYMENT COMPLETE!"
echo "🔑 Program ID: $PROGRAM_ID"
echo "🌐 Network: localhost"
echo "💻 Frontend updated automatically"

# Keep validator running
echo "Local validator is running. Press Ctrl+C to stop."
wait $VALIDATOR_PID