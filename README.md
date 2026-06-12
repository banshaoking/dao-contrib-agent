# DAO Contrib Agent

> AI-driven DAO contribution tracking and on-chain settlement agent.

Automatically collect contributions from GitHub, Discord, and other platforms. Use AI to evaluate impact. Distribute rewards fairly via on-chain batch settlement.

## Features

- **Multi-Platform Collection** — GitHub PRs, commits, reviews; Discord messages and help sessions
- **AI-Powered Scoring** — Mimo AI (mimov2.5pro) evaluates contributions across 4 dimensions with explainable reasoning
- **Flexible Rules Engine** — Configurable weights for each contribution type with real-time preview
- **Batch On-Chain Settlement** — One-click payout to multiple contributors, saving gas
- **Wallet Signature Auth** — EIP-4361 challenge-response authentication with replay protection
- **Security First** — Rate limiting, Zod input validation, XSS sanitization, audit logging

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Tailwind CSS, Vite |
| Backend | Node.js, Express, TypeScript, Zod |
| AI | Mimo API (mimov2.5pro), OpenAI API (GPT-5.5) |
| Smart Contract | Solidity 0.8.19, Hardhat, OpenZeppelin |
| Wallet | MetaMask, Cobo Agentic Wallet |

## Quick Start

### Prerequisites

- Node.js >= 18
- MetaMask browser extension
- Sepolia testnet ETH (for on-chain features)

### 1. Clone

```bash
git clone https://github.com/YOUR_USERNAME/dao-contrib-agent.git
cd dao-contrib-agent
```

### 2. Install Dependencies

```bash
# Backend
cd backend && npm install

# Frontend
cd ../frontend && npm install

# Contracts (optional)
cd ../contracts && npm install
```

### 3. Configure Environment

```bash
# Backend
cd backend
cp .env.example .env
# Edit .env with your API keys

# Contracts (optional)
cd ../contracts
cp .env.example .env
```

### 4. Start Development

```bash
# Terminal 1 — Backend
cd backend && npm run dev

# Terminal 2 — Frontend
cd frontend && npm run dev
```

Open http://localhost:5173

### 5. Demo Mode

Click **"Enable Demo Mode"** in the sidebar to try all features without any API configuration.

## Project Structure

```
dao-contrib-agent/
├── frontend/                # React application
│   └── src/
│       ├── components/      # UI components
│       ├── hooks/           # useWallet, useDemoMode, useLang
│       └── utils/           # API client, formatting, auth
│
├── backend/                 # Express API server
│   └── src/
│       ├── routes/          # API endpoints
│       ├── services/        # AI, GitHub, Blockchain, Cobo
│       └── middleware/       # Security, validation, rate limiting
│
├── contracts/               # Solidity smart contracts
│   ├── contracts/           # ContribSettlement.sol, MockERC20.sol
│   ├── scripts/             # Deploy and demo scripts
│   └── test/                # Contract tests (23 cases)
│
└── docs/                    # Project proposal and documentation
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/contributions` | List contributions |
| POST | `/api/contributions/github` | Fetch from GitHub |
| POST | `/api/contributions/manual` | Add manually |
| POST | `/api/contributions/analyze` | AI analysis |
| GET | `/api/rules` | List rules |
| POST | `/api/rules` | Create rule |
| POST | `/api/settlements/execute` | Execute settlement |
| POST | `/api/reports/generate` | Generate AI report |

## Smart Contract

**ContribSettlement.sol** — Sepolia Testnet

- `recordContributions()` — Batch record contributions on-chain
- `settleBatch()` — Execute batch USDC transfers
- `deposit()` / `withdraw()` — Fund management
- OpenZeppelin AccessControl + ReentrancyGuard + SafeERC20

```bash
# Compile
cd contracts && npm run compile

# Run tests
npm test

# Deploy to Sepolia
npm run deploy:sepolia
```

## Security

| Layer | Implementation |
|-------|---------------|
| Rate Limiting | 4 tiers: global (100/15min), auth (10/15min), settlement (5/hr), AI (20/10min) |
| Input Validation | Zod schemas for all endpoints |
| Wallet Auth | EIP-4361 signature verification with nonce replay protection |
| XSS Protection | Input sanitization middleware |
| HTTP Security | Helmet + CSP + HSTS + X-Frame-Options |
| Audit Logging | All sensitive operations logged |

## Environment Variables

See [backend/.env.example](backend/.env.example) for full list.

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENAI_API_KEY` | Yes* | OpenAI API key for report generation |
| `MIMO_API_KEY` | Yes* | Mimo API key for contribution scoring |
| `GITHUB_TOKEN` | No | GitHub personal access token |
| `RPC_URL` | No | Ethereum RPC URL (Infura/Alchemy) |
| `PRIVATE_KEY` | No | Wallet private key for on-chain ops |
| `CONTRACT_ADDRESS` | No | Deployed contract address |

*At least one AI API key is required.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License — see [LICENSE](LICENSE) for details.

## Acknowledgments

- [LXDAO](https://lxdao.io/) — Community support
- [AI × Web3 School](https://casualhackathon.com/) — Hackathon organizer
- [OpenZeppelin](https://www.openzeppelin.com/) — Smart contract libraries
- [Cobo](https://www.cobowallet.com/) — Agentic Wallet infrastructure
