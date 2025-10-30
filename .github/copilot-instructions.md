# Solana Dare Betting Platform

This project is a Solana-based dare betting platform where users can create dares, bet on outcomes, and earn rewards. The project is structured as a monorepo with:

- **Smart Contract**: Anchor-based Solana program for dare management and betting
- **Frontend**: Next.js application for user interaction

## Project Structure
- `/programs/` - Anchor smart contracts
- `/app/` - Next.js frontend application  
- `/tests/` - Smart contract tests

## Development Guidelines
- Use Anchor framework for Solana program development
- Follow Solana best practices for account management
- Implement proper error handling and validation
- Use TypeScript throughout the project

## Core Features
- Create dares with deadlines and minimum bets
- Two-sided betting: "Will Do" vs "Won't Do"
- Proof submission system for dare completion
- Automatic payout distribution (50% completer, 48% winning bettors, 2% creator)
- Time-based expiration handling

## Prerequisites for Development
- Rust and Cargo
- Solana CLI
- Anchor CLI
- Node.js 18+
- A Solana wallet for testing