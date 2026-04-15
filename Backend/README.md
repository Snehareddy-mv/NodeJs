# ChatGenius - AI-Powered Chat Platform Backend

An intelligent team collaboration platform with real-time messaging and AI assistant powered by Google Gemini.

## 🚀 Features

### Core Features
- ✅ User Authentication (JWT)
- ✅ Role-based Access Control (Admin/User)
- 💬 Real-time Chat (Socket.io)
- 📱 Channels & Direct Messages
- 📎 File Uploads (Cloudinary)
- 🤖 AI Assistant Integration (Google Gemini)

### AI-Powered Features
- 🤖 **AI Chatbot** - Ask questions and get intelligent responses
- 📝 **Message Summarization** - Get TL;DR of long conversations
- 💡 **Smart Replies** - AI-suggested responses
- 🔍 **Sentiment Analysis** - Understand team mood
- 🎯 **Context-Aware AI** - AI understands conversation history

## 📋 Prerequisites

- Node.js (v14 or higher)
- MongoDB
- Google Gemini API Key (Free)
- Cloudinary Account (Free)

## 🛠️ Installation

### 1. Clone the repository
```bash
git clone https://github.com/Snehareddy-mv/NodeJs.git
cd NodeJs/Backend
```

### 2. Install dependencies
```bash
npm install
```

### 3. Setup Environment Variables

Create a `.env` file in the Backend directory:

```env
PORT=5000
MONGO_URL=mongodb+srv://your-username:your-password@cluster.mongodb.net/chatgenius
JWT_SECRET=your-super-secret-jwt-key
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
GEMINI_API_KEY=your-google-gemini-api-key
FRONTEND_URL=http://localhost:5173
```

### 4. Get Free API Keys

#### Google Gemini API (100% Free)
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Click "Get API Key"
3. Create a new API key
4. Copy and paste into `.env` as `GEMINI_API_KEY`

#### Cloudinary (Free Tier)
1. Sign up at [Cloudinary](https://cloudinary.com/)
2. Get your credentials from Dashboard
3. Add to `.env`

### 5. Start the Server

```bash
# Development mode
npm start

# Production mode
npm run start:prod
```

Server will run on `http://localhost:5000`

## 📚 API Documentation

Access Swagger documentation at: `http://localhost:5000/api-docs`

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Users
- `GET /api/users/all-users` - Get all users (Admin only)
- `GET /api/users/single-user/:id` - Get user by ID
- `PUT /api/users/update-user/:id` - Update user
- `DELETE /api/users/delete-user/:id` - Delete user
- `POST /api/users/refresh-token` - Refresh access token
- `POST /api/users/upload-picture` - Upload profile picture

### Channels
- `POST /api/channels` - Create channel
- `GET /api/channels` - Get all channels
- `GET /api/channels/:id` - Get channel by ID
- `PUT /api/channels/:id` - Update channel
- `DELETE /api/channels/:id` - Delete channel
- `POST /api/channels/:id/members` - Add member to channel
- `DELETE /api/channels/:id/members/:userId` - Remove member

### Messages
- `POST /api/messages` - Send message
- `GET /api/messages/channel/:channelId` - Get channel messages
- `GET /api/messages/direct/:userId` - Get direct messages
- `POST /api/messages/ai` - Ask AI assistant
- `GET /api/messages/summarize/:channelId` - Summarize conversation
- `GET /api/messages/smart-reply/:messageId` - Generate smart reply
- `DELETE /api/messages/:id` - Delete message

## 🔌 WebSocket Events

### Client → Server
- `channel:join` - Join a channel
- `channel:leave` - Leave a channel
- `message:send` - Send a message
- `typing:start` - Start typing indicator
- `typing:stop` - Stop typing indicator
- `message:delete` - Delete a message

### Server → Client
- `user:online` - User came online
- `user:offline` - User went offline
- `user:joined` - User joined channel
- `user:left` - User left channel
- `message:new` - New message received
- `message:deleted` - Message was deleted
- `typing:start` - Someone started typing
- `typing:stop` - Someone stopped typing

## 🤖 AI Features Usage

### Ask AI Assistant
```javascript
POST /api/messages/ai
{
  "question": "What is the weather like?",
  "channelId": "channel-id" // optional, for context
}
```

### Summarize Conversation
```javascript
GET /api/messages/summarize/:channelId
```

### Generate Smart Reply
```javascript
GET /api/messages/smart-reply/:messageId
```

## 🧪 Testing

```bash
npm test
```

## 📦 Project Structure

```
Backend/
├── config/           # Configuration files
├── controllers/      # Route controllers
├── middlewares/      # Custom middlewares
├── models/          # Database models
├── routes/          # API routes
├── services/        # Business logic (AI service)
├── socket/          # Socket.io handlers
├── tests/           # Test files
├── utils/           # Utility functions
├── validators/      # Input validation schemas
├── app.js           # Express app setup
└── server.js        # Server entry point
```

## 🔒 Security Features

- JWT Authentication
- Password Hashing (bcrypt)
- Rate Limiting
- Input Validation
- CORS Protection
- Environment Variables

## 🚀 Deployment

### Using Docker
```bash
docker-compose up -d
```

### Manual Deployment
1. Set environment variables on your hosting platform
2. Run `npm run start:prod`

## 📝 License

MIT

## 👨‍💻 Author

Sneha Reddy

## 🤝 Contributing

Pull requests are welcome!
