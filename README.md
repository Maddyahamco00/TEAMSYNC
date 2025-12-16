# TeamSync - Real-Time Collaboration Platform

A modern real-time collaboration platform for distributed teams, built with React, Node.js, and WebSocket technology.

## 🚀 Project Overview

TeamSync enables teams to communicate effectively through channels, direct messaging, video calls, and shared workspaces. Built as a competitive alternative to Slack/Microsoft Teams for small-to-medium businesses.

## 🛠 Tech Stack

**Frontend:**
- React 18+ with TypeScript
- Tailwind CSS
- Socket.io Client
- Redux Toolkit
- WebRTC

**Backend:**
- Node.js with Express
- Socket.io
- PostgreSQL
- Redis
- JWT Authentication

**Infrastructure:**
- Docker
- AWS S3
- GitHub Actions

## 📁 Project Structure

```
teamsync-platform/
├── frontend/          # React TypeScript frontend
├── backend/           # Node.js Express backend
├── shared/           # Shared types and utilities
├── docs/             # Documentation
├── docker-compose.yml
└── README.md
```

## 🏃‍♂️ Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Redis 6+
- Docker (optional)

### Development Setup

1. **Clone the repository**
```bash
git clone https://github.com/Maddyahamco00/TEAMSYNC
cd teamsync-platform
```

2. **Backend Setup**
```bash
cd backend
npm install
cp .env.example .env
# Configure your database and Redis URLs in .env
npm run dev
```

3. **Frontend Setup**
```bash
cd frontend
npm install
npm start
```

4. **Using Docker (Alternative)**
```bash
docker-compose up -d
```

## 📅 Development Progress

### ✅ Week 1-2: Foundation & Authentication
- [x] Project repository structure
- [x] Development environment setup
- [x] User authentication system
- [x] Basic UI layout
- [x] PostgreSQL schema design

### 🔄 Week 3-4: Core Messaging Features
- [ ] Workspace/organization structure
- [ ] Real-time messaging with Socket.io
- [ ] Direct messaging
- [ ] File upload and sharing

### 📋 Week 5-6: Advanced Features
- [ ] Video/audio calling (WebRTC)
- [ ] @mentions and notifications
- [ ] Message threading

### 🎯 Week 7-8: Polish & Deployment
- [ ] Performance optimization
- [ ] Testing and documentation
- [ ] CI/CD pipeline
- [ ] Production deployment

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

---

**Project Duration:** 8 weeks  
**Start Date:** December 16, 2024  
**Target Completion:** February 9, 2025