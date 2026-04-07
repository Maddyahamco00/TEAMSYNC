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
├── docker-compose.yml          # Development environment
├── docker-compose.prod.yml     # Production environment
├── nginx.conf                  # Reverse proxy configuration
├── deploy-prod.bat            # Production deployment script
└── README.md
```

## 🏃‍♂️ Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Redis 6+
- Docker & Docker Compose

### Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/teamsync.git
   cd teamsync
   ```

2. **Start development environment**
   ```bash
   # Windows
   start-dev.bat

   # Or manually:
   docker-compose up --build
   ```

3. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000/api

### Production Deployment

1. **Deploy to production**
   ```bash
   # Windows
   deploy-prod.bat

   # Or manually:
   docker-compose -f docker-compose.prod.yml up --build -d
   ```

2. **Run database migrations**
   ```bash
   docker-compose -f docker-compose.prod.yml exec backend npm run migrate
   ```

3. **Seed demo data**
   ```bash
   docker-compose -f docker-compose.prod.yml exec backend npm run db:seed
   ```

4. **Access the application**
   - Application: http://localhost
   - API: http://localhost/api
   - Backend Direct: http://localhost:5000

## 📋 Demo Accounts

- **Admin**: admin@teamsync.com / password123
- **User**: john@teamsync.com / password123
- **User**: jane@teamsync.com / password123

## 🔧 Available Scripts

### Backend
```bash
cd backend
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run migrate      # Run database migrations
npm run db:seed      # Seed database with demo data
npm run db:studio    # Open Prisma Studio
```

### Frontend
```bash
cd frontend
npm start            # Start development server
npm run build        # Build for production
npm test             # Run tests
```

### Docker
```bash
# Development
docker-compose up --build

# Production
docker-compose -f docker-compose.prod.yml up --build -d
docker-compose -f docker-compose.prod.yml down

# Database management
docker-compose -f docker-compose.prod.yml exec backend npm run migrate
docker-compose -f docker-compose.prod.yml exec backend npm run db:seed
```

## 🌟 Features

### ✅ Completed
- Real-time messaging with Socket.io
- Channel-based communication
- User authentication & authorization
- Responsive UI with Tailwind CSS
- PostgreSQL database integration
- Redis caching
- Docker containerization
- Production deployment setup

### 🚧 In Development
- Video/audio calling with WebRTC
- @mentions and notifications
- Message threading
- File upload with storage
- User profile management
- Search functionality

## 🔒 Environment Variables

### Backend (.env)
```env
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://user:password@postgres:5432/teamsync_db
REDIS_URL=redis://redis:6379
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://nginx
```

### Frontend (.env)
```env
REACT_APP_API_URL=http://localhost/api
```

## 📊 API Documentation

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user

### Workspaces
- `GET /api/workspaces` - List user's workspaces
- `POST /api/workspaces` - Create workspace
- `GET /api/workspaces/:id` - Get workspace details
- `POST /api/workspaces/:id/channels` - Create channel

### Messages
- `GET /api/messages/channel/:channelId` - Get channel messages
- `POST /api/messages/channel/:channelId` - Send message
- `GET /api/messages/search` - Search messages

### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update profile
- `GET /api/users` - List all users

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with modern web technologies
- Inspired by successful collaboration platforms
- Community-driven development

1. **Clone the repository**
```bash
<<<<<<< HEAD
git clone https://github.com/yourusername/teamsync-platform.git
=======
git clone https://github.com/Maddyahamco00/TEAMSYNC
>>>>>>> 3572aa689242e8d924d216ac3e8896914c2b20ac
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

<<<<<<< HEAD
5. **Quick Start (Windows)**
```bash
# Run the development startup script
start-dev.bat
```

## 📝 Current Features

- ✅ User authentication (register/login)
- ✅ Real-time messaging with Socket.io
- ✅ Channel-based communication
- ✅ Responsive chat interface
- ✅ User presence indicators
- ✅ Message history
- ✅ Navigation between dashboard and chat

=======
>>>>>>> 3572aa689242e8d924d216ac3e8896914c2b20ac
## 📅 Development Progress

### ✅ Week 1-2: Foundation & Authentication
- [x] Project repository structure
- [x] Development environment setup
- [x] User authentication system
- [x] Basic UI layout
- [x] PostgreSQL schema design

<<<<<<< HEAD
### ✅ Week 3-4: Core Messaging Features
- [x] Workspace/organization structure
- [x] Real-time messaging with Socket.io
- [x] Basic chat interface
- [x] Channel management
- [x] Message display and input
=======
### 🔄 Week 3-4: Core Messaging Features
- [ ] Workspace/organization structure
- [ ] Real-time messaging with Socket.io
>>>>>>> 3572aa689242e8d924d216ac3e8896914c2b20ac
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
<<<<<<< HEAD
**Start Date:** December 16, 2024  
**Target Completion:** February 9, 2025
=======
>>>>>>> 3572aa689242e8d924d216ac3e8896914c2b20ac
