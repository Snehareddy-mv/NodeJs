# ChatGenius Frontend

React-based frontend for the ChatGenius AI-powered chat platform.

## 🚀 Features

- User authentication (Login/Register)
- Real-time messaging with Socket.io
- Channel-based chat
- Modern, responsive UI
- State management with Zustand
- Toast notifications

## 📦 Installation

```bash
npm install
```

## 🛠️ Development

```bash
npm run dev
```

The app will run on `http://localhost:5173`

## 🔧 Configuration

Make sure the backend is running on `http://localhost:5000`

If you need to change the API URL, update it in `src/services/api.js` and `src/services/socket.js`

## 📁 Project Structure

```
src/
├── pages/          # Page components (Login, Register, Chat)
├── services/       # API and Socket.io services
├── store/          # Zustand state management
├── App.jsx         # Main app component with routing
└── main.jsx        # Entry point
```

## 🎨 Styling

The app uses inline styles for simplicity. You can add Tailwind CSS for better styling:

```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

## 🔑 Environment Variables

No environment variables needed - API URL is hardcoded for development.

For production, create a `.env` file:

```
VITE_API_URL=https://your-backend-url.com/api
VITE_SOCKET_URL=https://your-backend-url.com
```

## 📝 Usage

1. Register a new account
2. Login with your credentials
3. Create or join channels
4. Start chatting in real-time!

## 🚀 Build for Production

```bash
npm run build
```

The build will be in the `dist` folder.

## 📄 License

MIT
