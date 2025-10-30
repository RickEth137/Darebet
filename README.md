# Devils Due - Solana Dare Betting Platform 😈

A decentralized betting platform on Solana where users can create dares and bet on whether someone will complete them or not. Built with Anchor framework and Next.js.

## 🎯 How It Works

1. **Create a Dare**: Users create challenges with a description, deadline, and minimum bet amount
2. **Place Bets**: People bet either "Will Do" or "Won't Do" on whether someone will complete the dare
3. **Submit Proof**: Anyone can submit proof (video, image, etc.) to claim completion of the dare
4. **Claim Rewards**: Winners get their share of the betting pool

## 💰 Payout Structure

- **Dare Completed**: 
  - Person who submits proof gets 50% of the pool
  - "Will Do" bettors split 48% proportionally to their bet size
  - Creator gets 2% fee
- **Dare Expires Uncompleted**:
  - "Won't Do" bettors split 98% proportionally
  - Creator gets 2% fee
- **Early Cash Out**:
  - Available anytime except last 10 minutes before deadline
  - 10% penalty applied to cash out amount
  - Remaining 90% returned to bettor

## 🏗️ Project Structure

```
├── programs/
│   └── dare-betting/           # Anchor smart contract
│       ├── src/
│       │   └── lib.rs         # Main program logic
│       └── Cargo.toml
├── app/                       # Next.js frontend
│   ├── src/
│   │   ├── app/              # App router pages
│   │   ├── components/       # React components
│   │   ├── hooks/           # Custom hooks
│   │   ├── lib/             # Utilities
│   │   └── types/           # TypeScript types
│   └── package.json
├── tests/                    # Smart contract tests
├── Anchor.toml              # Anchor configuration
└── package.json             # Root package.json
```

## 🔧 Prerequisites

Before you can run this project, you need to install:

### 1. Rust
```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source ~/.cargo/env
```

### 2. Solana CLI
```bash
sh -c "$(curl -sSfL https://release.solana.com/v1.18.4/install)"
```

### 3. Anchor CLI
```bash
npm install -g @coral-xyz/anchor-cli
```

### 4. Node.js & npm
- Download from [nodejs.org](https://nodejs.org/) (v18 or higher)

## 🚀 Getting Started

### 1. Clone and Install Dependencies

```bash
# Install root dependencies
npm install

# Install frontend dependencies
cd app && npm install && cd ..
```

### 2. Configure Solana (for local development)

```bash
# Set to localhost
solana config set --url localhost

# Create a keypair (if you don't have one)
solana-keygen new

# Start local validator (in a separate terminal)
solana-test-validator
```

### 3. Build and Deploy Smart Contract

```bash
# Build the Anchor program
anchor build

# Deploy to local network
anchor deploy

# Run tests
anchor test
```

### 4. Update Program ID

After deploying, update the program ID in:
- `Anchor.toml` (line 13-17)
- `app/src/hooks/useDareProgram.ts` (line 13)
- `programs/dare-betting/src/lib.rs` (line 4)

### 5. Start Frontend

```bash
cd app
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the application.

## 🎮 Using the Application

### 1. Connect Wallet
- Click "Connect Wallet" in the top right
- Select your Solana wallet (Phantom, Solflare, etc.)

### 2. Create a Dare
- Click "Create Dare" button
- Fill in title, description, deadline, and minimum bet
- Confirm the transaction

### 3. Place Bets
- Browse active dares on the homepage
- Click "Place Bet" on any dare
- Choose "Will Do" or "Won't Do"
- Enter bet amount and confirm

### 4. Submit Proof
- If you completed a dare, click "Submit Proof"
- Provide proof hash (video URL, image hash, etc.)
- Add description of your proof
- Confirm transaction

### 5. Claim Winnings
- After a dare is completed or expired
- Click "Claim Winnings" if you're eligible
- Confirm transaction to receive your payout

### 6. Cash Out Early (Optional)
- Click "Cash Out Early" on any of your active bets
- Available until 10 minutes before deadline
- 10% penalty applied, receive 90% of your bet back
- Cannot cash out in the final 10 minutes

## 🧪 Testing

Run the test suite:

```bash
anchor test
```

Tests cover:
- Dare creation
- Betting mechanics
- Proof submission
- Payout calculations
- Edge cases and error conditions

## 📝 Smart Contract Features

### Core Instructions
- `create_dare`: Create a new dare with parameters
- `place_bet`: Place a bet on dare outcome
- `submit_proof`: Submit proof of dare completion
- `claim_winnings`: Claim betting winnings
- `claim_completion_reward`: Claim reward for completing dare
- `claim_creator_fee`: Creator claims their 2% fee
- `cash_out_early`: Cash out before dare ends (10% penalty, 10min restriction)

### Security Features
- Time-based validation (deadline checks)
- Minimum bet enforcement
- Preventing double-claiming
- Proper account ownership validation
- Safe math operations with overflow protection
- Early cash out restrictions (10-minute deadline buffer)
- Penalty mechanism for early withdrawals

## 🎨 Frontend Features

- **Responsive Design**: Works on desktop and mobile
- **Real-time Updates**: Live betting pools and dare status
- **Wallet Integration**: Seamless Solana wallet connection
- **Intuitive UI**: Easy-to-use betting interface
- **Time Tracking**: Visual countdown to dare deadlines

## 🔗 Technology Stack

- **Blockchain**: Solana
- **Smart Contracts**: Anchor Framework (Rust)
- **Frontend**: Next.js 14, React, TypeScript
- **Styling**: Tailwind CSS
- **Wallet**: Solana Wallet Adapter
- **State Management**: React Hooks
- **Build Tools**: Anchor CLI, Webpack

## 🌐 Deployment

### Render Deployment

This project is configured for deployment on Render:

1. **Fork/Connect Repository**: Connect https://github.com/RickEth137/Darebet to Render
2. **Create Web Service**: 
   - Build Command: `npm run build`
   - Start Command: `npm run start`
   - Environment: Node.js
3. **Environment Variables**:
   - `NODE_ENV=production`
   - `NEXT_PUBLIC_SOLANA_NETWORK=devnet` (or mainnet-beta)
   - Add any other required environment variables

### Manual Deployment Steps

```bash
# Build the project
npm run build

# Start production server
npm run start
```

## 🛠️ Development Tasks

Access development tasks in VS Code:
- `Ctrl+Shift+P` → "Tasks: Run Task"
- Available tasks:
  - Install Frontend Dependencies
  - Start Frontend Dev Server
  - Build Anchor Program
  - Deploy Anchor Program

## 🐛 Troubleshooting

### Common Issues

1. **"anchor command not found"**
   ```bash
   npm install -g @coral-xyz/anchor-cli
   ```

2. **"Permission denied" on Windows**
   - Run PowerShell as Administrator
   - Or use WSL for better compatibility

3. **Frontend compilation errors**
   - Ensure all dependencies are installed: `cd app && npm install`
   - Check Node.js version: `node --version` (should be 18+)

4. **Transaction failures**
   - Ensure your wallet has SOL for transaction fees
   - Check that Solana validator is running
   - Verify program ID is correct

### Getting Help

- Check [Anchor documentation](https://book.anchor-lang.com/)
- Join [Solana Discord](https://discord.gg/solana)
- Review [Solana Cookbook](https://solanacookbook.com/)

## 📄 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 🚨 Disclaimer

This is experimental software. Use at your own risk. Not audited for mainnet deployment.

---

Built with ❤️ for the Solana ecosystem