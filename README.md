# Avalanche Pong Game

A web-based PONG game on the **Avalanche Fuji Testnet** with blockchain integration for recording game scores. Built with Next.js, React, TypeScript, Ethers.js v6, and Solidity.

## Architecture

- **Smart Contract** (Solidity): Single source of truth, emits events for score records
- **Fastify Serverless Function** (TypeScript): Transaction submitter with server-side signing
- **React Frontend** (TypeScript): Handles all data reading by calling Avalanche RPC directly

## Prerequisites

- Node.js 20.9.0+ (required for Next.js 16)
- MetaMask browser extension
- Avalanche Fuji Testnet AVAX (get from faucet)

## Project Structure

```
avalanche-pong/
├── api/
│   └── submit-score.ts          # Fastify serverless function for transaction submission
├── app/
│   ├── page.tsx                 # Main page layout
│   └── globals.css              # Global styles
├── components/
│   ├── Header.tsx               # Header with network info
│   ├── PlayablePongGame.tsx     # Pong game component
│   ├── Transactions.tsx        # Transaction history table
│   └── ShaderBackgroundWrapper.tsx
├── contracts/
│   └── GameScore.sol            # Solidity smart contract
├── scripts/
│   └── deploy.ts                # Contract deployment script
├── utils/
│   ├── blockchain.ts            # Blockchain utility functions
│   └── ShaderBackground.ts      # WebGL shader background
└── assets/
    └── svgs.ts                  # SVG path data
```

## Features

- **Playable Pong Game**: 1v1 and 1vAI modes with score tracking
- **Blockchain Integration**: Game scores recorded on Avalanche Fuji Testnet
- **Transaction History**: View last 10 game results from the blockchain
- **Live Network Stats**: Real-time block number and network status
- **Responsive Design**: Mobile-first layout that adapts to all screen sizes
- **Animated Background**: WebGL shader effects

## Game Controls

- **Left Paddle**: `W` (up) / `S` (down)
- **Right Paddle**: `O` (up) / `K` (down) - only in 1v1 mode
- **AI Mode**: Right paddle moves automatically

## Smart Contract

The `GameScore.sol` contract emits a `ScoreRecorded` event with:
- `submitterAddress` (indexed): Address that submitted the score
- `winner`: Winner's username
- `loser`: Loser's username
- `score`: Final score (e.g., "3-1")
- `duration`: Game duration in seconds
- `timestamp`: Block timestamp when recorded

## License

MIT