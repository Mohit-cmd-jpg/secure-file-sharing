# SecureShare - Blockchain File Sharing

A minimal MERN + Web3 application for secure file upload, controlled sharing, and blockchain-based integrity verification.

## 🎯 Core Features

- **User Authentication** - JWT-based register/login
- **Secure File Upload** - Upload to IPFS via Pinata (max 10MB)
- **Controlled Sharing** - Share files with other users by email
- **Blockchain Verification** - Store file hash on Ethereum for integrity verification

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (Vercel)                       │
│  React + Vite + Ethers.js                                       │
│  Pages: Login, Register, Dashboard, Upload, SharedWithMe        │
└──────────────────────────────┬──────────────────────────────────┘
                               │
              ┌────────────────┼────────────────┐
              ▼                                 ▼
┌─────────────────────────┐         ┌─────────────────────────┐
│   BACKEND (Render)      │         │  BLOCKCHAIN (Sepolia)   │
│   Express + MongoDB     │         │  FileStorage.sol        │
│                         │         │  - addFile(hash)        │
│   /auth/register,login  │         │  - verifyHash(hash)     │
│   /files/upload,share   │         │  - grantAccess()        │
│         │               │         └─────────────────────────┘
│         ▼               │
│   ┌───────────┐         │
│   │  Pinata   │ (IPFS)  │
│   └───────────┘         │
└─────────────────────────┘
```

## 📁 Project Structure

```
/client          → React frontend (Vercel)
/server          → Express backend (Render)  
/contracts       → Solidity + Hardhat (Sepolia)
```

## 🚀 Quick Start

### 1. Install All Dependencies
```bash
npm run install:all
```

### 2. Setup Environment Variables

**server/.env:**
```env
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your-secret
PINATA_API_KEY=xxx
PINATA_SECRET_KEY=xxx
```

**client/.env:**
```env
VITE_API_URL=http://localhost:5000
VITE_CONTRACT_ADDRESS=0x...
```

**contracts/.env:**
```env
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
PRIVATE_KEY=your-wallet-private-key
```

### 3. Deploy Smart Contract
```bash
cd contracts
npm install
npm run deploy
```

### 4. Run Locally
```bash
# Terminal 1
npm run dev:server

# Terminal 2
npm run dev:client
```

---

## 🌐 Deployment Guide

### Frontend → Vercel
1. Push to GitHub
2. Import in Vercel
3. Set env vars: `VITE_API_URL`, `VITE_CONTRACT_ADDRESS`
4. Deploy

### Backend → Render
1. Create Web Service
2. Connect GitHub repo, select `/server`
3. Build: `npm install`, Start: `npm start`
4. Add env vars

### Contract → Sepolia
```bash
cd contracts
npm run deploy
```

---

## 🔐 Smart Contract

| Function | Description |
|----------|-------------|
| `addFile(hash)` | Register file hash |
| `verifyHash(hash)` | Check if hash exists |
| `grantAccess(id, wallet)` | Grant access |
| `revokeAccess(id, wallet)` | Revoke access |

---

## 🎤 Interview Points

**5 min:** Problem → Solution → Stack → Flow  
**10 min:** JWT auth, Pinata IPFS, Solidity contract, MetaMask, sharing

## 📝 License
MIT
