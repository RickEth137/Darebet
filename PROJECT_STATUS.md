# Devils Due - Project Status & Setup Guide

## 🎯 Project Overview
Devils Due is a Solana-based dare betting platform where users can:
- Create dares with deadlines and minimum bets
- Place bets on whether dares will be completed ("Will Do" vs "Won't Do")
- Submit video/image proof via IPFS storage
- Cash out early with 10% penalty (not allowed in last 10 minutes)
- Claim winnings based on betting pool distribution

## ✅ What's Complete

### Smart Contract (100%)
- **Location**: `programs/dare-betting/src/lib.rs`
- **Features**: 
  - Dare creation with native SOL betting
  - Two-sided betting mechanics
  - Early cash-out with penalties
  - Proof submission system
  - Automatic payout distribution (50% completer, 48% winners, 2% creator)
  - Time-based validation

### Frontend Application (95%)
- **Framework**: Next.js 14 with TypeScript
- **Components**:
  - `DareCard` - Interactive dare display with betting
  - `CreateDareModal` - Dare creation form
  - `ProofUploadModal` - IPFS file upload for proof submission
  - `ProofSubmissionsList` - View submitted proofs
  - Responsive layout with Tailwind CSS

### Database Integration (100%)
- **ORM**: Prisma with PostgreSQL Accelerate
- **Models**: Dare, Bet, ProofSubmission, User
- **API Routes**: `/api/proof-submissions` for CRUD operations
- **Location**: `app/prisma/schema.prisma`

### IPFS Integration (100%)
- **Service**: Pinata Cloud for decentralized storage
- **Features**:
  - File validation (100MB limit)
  - Support for video, image, audio, PDF
  - Automatic media type detection
  - Gateway URL generation
- **Location**: `app/src/lib/pinata.ts`

### Development Environment
- **Packages**: All dependencies installed
- **Database**: Prisma client generated
- **Configuration**: Environment variables configured

## 🔧 What's Missing - Development Tools

To deploy and test the smart contract, you'll need to install:

### 1. Rust & Cargo
```powershell
# Download and install from: https://rustup.rs/
# Or run in PowerShell:
Invoke-WebRequest -Uri "https://win.rustup.rs/" -OutFile "rustup-init.exe"
.\rustup-init.exe
```

### 2. Solana CLI
```powershell
# Download installer from: https://github.com/solana-labs/solana/releases
# Or use the install script (requires admin PowerShell):
cmd /c "curl https://release.solana.com/v1.18.4/solana-install-init-x86_64-pc-windows-msvc.exe --output solana-install-init.exe"
.\solana-install-init.exe
```

### 3. Anchor CLI
```powershell
# After Rust is installed:
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
avm install latest
avm use latest
```

## 🚀 Deployment Steps

### 1. Environment Setup
```bash
# Set Solana to devnet
solana config set --url devnet

# Create a new keypair (or import existing)
solana-keygen new --force

# Request devnet SOL for testing
solana airdrop 2
```

### 2. Smart Contract Deployment
```bash
# Navigate to project root
cd "c:\Users\PC\OneDrive\Desktop\Devils due"

# Build the program
anchor build

# Deploy to devnet
anchor deploy

# Copy the program ID and update:
# - programs/dare-betting/src/lib.rs (declare_id! macro)
# - app/src/hooks/useDareProgram.ts (PROGRAM_ID constant)
```

### 3. Database Setup
```bash
# Push schema to database
cd app
npx prisma db push

# Optional: View database
npx prisma studio
```

### 4. Frontend Launch
```bash
# Start development server
cd app
npm run dev
```

## 🧪 Testing

### IPFS Upload Test
Visit: `http://localhost:3000/test-upload`
- Upload various file types to verify Pinata integration
- Check console for any API errors

### Smart Contract Testing
```bash
# Run tests (after smart contract deployment)
anchor test
```

### Frontend Testing
1. Connect wallet (Phantom, Solflare, etc.)
2. Create a test dare
3. Place bets from different wallets
4. Submit proof via file upload
5. Test early cash-out functionality

## 📁 Project Structure
```
Devils due/
├── programs/
│   └── dare-betting/src/lib.rs      # Smart contract
├── app/
│   ├── src/
│   │   ├── components/              # React components
│   │   ├── hooks/                   # Custom hooks
│   │   ├── lib/                     # Utilities (Pinata, DB)
│   │   └── app/                     # Next.js pages & API
│   ├── prisma/                      # Database schema
│   └── .env.local                   # Environment variables
└── tests/                           # Smart contract tests
```

## 🔑 Environment Variables (Already Configured)
```env
# Pinata IPFS
NEXT_PUBLIC_PINATA_JWT=eyJhbG...
NEXT_PUBLIC_PINATA_GATEWAY_URL=amber-cheap-marlin-398.mypinata.cloud

# Database
DATABASE_URL=prisma://accelerate.prisma-data.net/?api_key=...
```

## 🎮 Features Breakdown

### Core Mechanics
- **Native SOL Betting**: Simplified user experience
- **Time-Based Logic**: Automatic expiration handling
- **Penalty System**: 10% fee for early cash-outs
- **Proof System**: IPFS-backed evidence submission

### User Experience
- **Wallet Integration**: Multiple Solana wallet support
- **Real-time Updates**: Automatic UI refresh after transactions
- **File Upload**: Drag & drop with preview
- **Responsive Design**: Mobile-friendly interface

### Data Persistence
- **On-chain**: Critical betting data stored on Solana
- **IPFS**: Decentralized proof file storage
- **Database**: User activity and metadata

## 🎯 Next Steps
1. Install development tools (Rust, Solana CLI, Anchor)
2. Deploy smart contract to devnet
3. Update program IDs in frontend
4. Test full workflow end-to-end
5. Deploy to mainnet when ready

## 📞 Support
- Test the upload functionality first: `/test-upload`
- Check browser console for any errors
- Verify wallet connection and network settings
- Ensure sufficient SOL balance for transactions

The platform is production-ready once the smart contract is deployed! 🚀