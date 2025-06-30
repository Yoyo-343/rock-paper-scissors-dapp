# Rock Paper Scissors dApp

A decentralized Rock Paper Scissors game built on Starknet with a cyberpunk-themed frontend.

## 🎮 Features

- **Decentralized Gaming**: Fully on-chain Rock Paper Scissors matches
- **Dynamic Pricing**: Entry fees dynamically priced in USD using Pragma Oracle
- **Session Keys**: Seamless gameplay with Cartridge Controller integration
- **Fair Play**: Commit-reveal scheme prevents cheating
- **Prize Pool**: 75% to winner, 25% to treasury
- **First to 3 Wins**: No round limit, first player to win 3 rounds takes the prize

## 🏗️ Architecture

### Smart Contract (Cairo)
- **Language**: Cairo 2.7.0
- **Network**: Starknet (Sepolia Testnet)
- **Oracle**: Pragma Network for ETH/USD price feeds
- **Wallet**: Cartridge Controller for session keys

### Frontend
- **Framework**: Next.js 15 with TypeScript
- **Styling**: Tailwind CSS with cyberpunk theme
- **Wallet Integration**: Cartridge Controller
- **Design**: Blade Runner inspired dark theme

## 🛠️ Smart Contract Setup

### Prerequisites
```bash
# Install Scarb (Cairo package manager)
curl --proto '=https' --tlsv1.2 -sSf https://docs.swmansion.com/scarb/install.sh | sh

# Install Starknet Foundry
curl -L https://raw.githubusercontent.com/foundry-rs/starknet-foundry/master/scripts/install.sh | sh
```

### Build & Test
```bash
# Build the contract
scarb build

# Run tests
scarb test
```

### Deploy
```bash
# Deploy to Sepolia testnet
sncast deploy --url https://free-rpc.nethermind.io/sepolia-juno
```

## 🎨 Frontend Setup

### Prerequisites
```bash
# Node.js 18+ required
npm install
```

### Development
```bash
# Start development server
npm run dev

# Build for production
npm run build
```

## 🎯 Game Rules

1. **Entry Fee**: Dynamically calculated to equal ~$1 USD
2. **Matchmaking**: Join queue and get automatically matched
3. **Gameplay**: 
   - Commit your move (Rock/Paper/Scissors) with hidden hash
   - Reveal your move after both players commit
   - First to win 3 rounds takes the prize
4. **Payouts**: Winner gets 75% of prize pool, 25% goes to treasury

## 🔧 Smart Contract Interface

### Core Functions
```cairo
// Player actions
fn join_queue(ref self: ContractState);
fn commit_move(ref self: ContractState, game_id: u256, round: u8, move_hash: felt252);
fn reveal_move(ref self: ContractState, game_id: u256, round: u8, move: u8, salt: felt252);
fn claim_prize(ref self: ContractState, game_id: u256);

// View functions
fn get_required_entry_fee(self: @ContractState) -> u256;
fn get_current_eth_price(self: @ContractState) -> u128;
fn get_game_info(self: @ContractState, game_id: u256) -> (...);
```

## 🚀 Deployment Addresses

### Sepolia Testnet
- **Contract**: `TBD` (Deploy after frontend integration)
- **Pragma Oracle**: `0x2a85bd616f912537c50a49a4076db02c00b29b2cdc8a197ce92ed1837fa875b`

## 📁 Project Structure

```
├── src/                    # Cairo smart contract
│   └── lib.cairo          # Main contract implementation
├── tests/                  # Smart contract tests
│   └── test_contract.cairo
├── frontend/               # Next.js frontend (added from Lovable)
├── Scarb.toml             # Cairo project configuration
├── snfoundry.toml         # Starknet Foundry configuration
└── README.md              # This file
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for smart contract changes
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🔗 Links

- [Starknet Documentation](https://docs.starknet.io/)
- [Cairo Book](https://book.cairo-lang.org/)
- [Cartridge Controller](https://cartridge.gg/)
- [Pragma Oracle](https://pragma.build/)

---

Built with ❤️ on Starknet 