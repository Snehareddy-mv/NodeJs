const dotenv = require("dotenv");
const mongoose = require("mongoose");
const http = require("http");
const { Server } = require("socket.io");
const app = require("./app");
const socketHandler = require("./socket/socketHandler");

dotenv.config();

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

socketHandler(io);

mongoose.connect(process.env.MONGO_URL)
  .then(() => {
    console.log("DB Connected");
  })
  .catch((err) => {
    console.log("Error in connecting DB", err);
  });

server.listen(process.env.PORT, () => {
  console.log(`Server is running on ${process.env.PORT}`);
  console.log(`Socket.io server is ready`);
});