const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const channelRoutes = require("./routes/channelRoutes");
const messageRoutes = require("./routes/messageRoutes");
const { limiter } = require("./middlewares/rateLimiter");
const { swaggerUi, specs } = require("./config/swagger");
const errorHandler = require("./middlewares/errorHandler");

const app = express();
app.use(express.json());

// CORS configuration for production and development
const corsOptions = {
  origin:
    process.env.NODE_ENV === "production"
      ? [
          "https://chat-ai-application-frontend.onrender.com",
          "https://node-js-seven-orcin.vercel.app",
          process.env.FRONTEND_URL,
        ].filter((url) => url) // Remove undefined values
      : ["http://localhost:5173", "http://localhost:3000"],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));

// Swagger documentation
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));

// Rate limiting - disable in test environment
const isTestEnv =
  process.env.NODE_ENV === "test" || process.env.JEST_WORKER_ID !== undefined;
console.log(
  "NODE_ENV:",
  process.env.NODE_ENV,
  "JEST_WORKER_ID:",
  process.env.JEST_WORKER_ID,
  "Rate limiter active:",
  !isTestEnv,
);

if (!isTestEnv) {
  app.use("/api", limiter);
}

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/channels", channelRoutes);
app.use("/api/messages", messageRoutes);

// Global error handler (MUST BE LAST)
app.use(errorHandler);

module.exports = app;
