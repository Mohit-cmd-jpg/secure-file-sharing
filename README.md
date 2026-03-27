# SecureShare - File Sharing

A minimal MERN application for secure file upload, controlled sharing, and file management.

## 🎯 Core Features

- **User Authentication** - JWT-based register/login
- **Secure File Upload** - Upload to IPFS via Pinata (max 10MB)
- **Controlled Sharing** - Share files with other users by email
- **File Management** - Remove uploaded files, view shared files, and revoke access

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (Vercel)                       │
│  React + Vite                                                   │
│  Pages: Login, Register, Dashboard, Upload, SharedWithMe        │
└──────────────────────────────┬──────────────────────────────────┘
                               │
               ┌───────────────┴───────────────┐
               ▼                               ▼
 ┌─────────────────────────┐         ┌─────────────────────────┐
 │   BACKEND (Render)      │         │  Pinata (IPFS)          │
 │   Express + MongoDB     │         │                         │
 │                         │         │                         │
 │   /auth/register,login  │         │                         │
 │   /files/upload,share   │         │                         │
 │   /files/:id (delete)   │         │                         │
 └─────────────────────────┘         └─────────────────────────┘
```

## 📁 Project Structure

```
/client          → React frontend
/server          → Express backend
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
```

### 3. Run Locally
```bash
# Terminal 1
npm run dev:server

# Terminal 2
npm run dev:client
```

## 📝 License
MIT
