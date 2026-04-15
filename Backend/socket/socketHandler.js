const jwt = require("jsonwebtoken");
const Message = require("../models/messageModel");
const Channel = require("../models/channelModel");

const socketHandler = (io) => {
  const users = new Map();

  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    
    if (!token) {
      return next(new Error("Authentication error"));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      socket.userRole = decoded.role;
      next();
    } catch (error) {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    console.log(`User connected: ${socket.userId}`);
    
    users.set(socket.userId, socket.id);
    
    io.emit("user:online", {
      userId: socket.userId,
      socketId: socket.id,
    });

    socket.on("channel:join", async (channelId) => {
      try {
        const channel = await Channel.findById(channelId);
        
        if (!channel) {
          socket.emit("error", { message: "Channel not found" });
          return;
        }

        if (!channel.members.some(member => member.toString() === socket.userId)) {
          socket.emit("error", { message: "Not a member of this channel" });
          return;
        }

        socket.join(`channel:${channelId}`);
        console.log(`User ${socket.userId} joined channel ${channelId}`);
        
        socket.to(`channel:${channelId}`).emit("user:joined", {
          userId: socket.userId,
          channelId,
        });
      } catch (error) {
        console.error("Error joining channel:", error);
        socket.emit("error", { message: "Failed to join channel" });
      }
    });

    socket.on("channel:leave", (channelId) => {
      socket.leave(`channel:${channelId}`);
      console.log(`User ${socket.userId} left channel ${channelId}`);
      
      socket.to(`channel:${channelId}`).emit("user:left", {
        userId: socket.userId,
        channelId,
      });
    });

    socket.on("message:send", async (data) => {
      try {
        const { content, channelId, receiverId, messageType, fileUrl } = data;

        const messageData = {
          content,
          sender: socket.userId,
          messageType: messageType || "text",
          fileUrl,
        };

        if (channelId) {
          messageData.channel = channelId;
          
          const channel = await Channel.findById(channelId);
          if (channel) {
            channel.lastActivity = Date.now();
            await channel.save();
          }
        } else if (receiverId) {
          messageData.receiver = receiverId;
        }

        const message = await Message.create(messageData);
        await message.populate('sender', 'name email profileImage');

        if (channelId) {
          await message.populate('channel', 'name');
          console.log(`📤 Emitting message to channel:${channelId}`, message.content);
          io.to(`channel:${channelId}`).emit("message:new", message);
        } else if (receiverId) {
          const receiverSocketId = users.get(receiverId);
          if (receiverSocketId) {
            io.to(receiverSocketId).emit("message:new", message);
          }
          socket.emit("message:new", message);
        }
      } catch (error) {
        console.error("Error sending message:", error);
        socket.emit("error", { message: "Failed to send message" });
      }
    });

    socket.on("typing:start", ({ channelId, receiverId }) => {
      if (channelId) {
        socket.to(`channel:${channelId}`).emit("typing:start", {
          userId: socket.userId,
          channelId,
        });
      } else if (receiverId) {
        const receiverSocketId = users.get(receiverId);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit("typing:start", {
            userId: socket.userId,
          });
        }
      }
    });

    socket.on("typing:stop", ({ channelId, receiverId }) => {
      if (channelId) {
        socket.to(`channel:${channelId}`).emit("typing:stop", {
          userId: socket.userId,
          channelId,
        });
      } else if (receiverId) {
        const receiverSocketId = users.get(receiverId);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit("typing:stop", {
            userId: socket.userId,
          });
        }
      }
    });

    socket.on("message:delete", async (messageId) => {
      try {
        const message = await Message.findById(messageId);
        
        if (!message) {
          socket.emit("error", { message: "Message not found" });
          return;
        }

        if (message.sender.toString() !== socket.userId) {
          socket.emit("error", { message: "Unauthorized" });
          return;
        }

        await Message.findByIdAndDelete(messageId);

        if (message.channel) {
          io.to(`channel:${message.channel}`).emit("message:deleted", messageId);
        } else if (message.receiver) {
          const receiverSocketId = users.get(message.receiver.toString());
          if (receiverSocketId) {
            io.to(receiverSocketId).emit("message:deleted", messageId);
          }
          socket.emit("message:deleted", messageId);
        }
      } catch (error) {
        console.error("Error deleting message:", error);
        socket.emit("error", { message: "Failed to delete message" });
      }
    });

    socket.on("message:edit", async ({ messageId, content }) => {
      try {
        const message = await Message.findById(messageId);
        if (!message) {
          socket.emit("error", { message: "Message not found" });
          return;
        }

        if (message.sender.toString() !== socket.userId) {
          socket.emit("error", { message: "Unauthorized" });
          return;
        }

        message.content = content;
        message.isEdited = true;
        message.editedAt = Date.now();
        await message.save();

        await message.populate('sender', 'name email profileImage');
        if (message.channel) {
          await message.populate('channel', 'name');
          io.to(`channel:${message.channel._id}`).emit("message:edited", message);
        }
      } catch (error) {
        console.error("Error editing message:", error);
        socket.emit("error", { message: "Failed to edit message" });
      }
    });

    socket.on("message:pin", async (messageId) => {
      try {
        const message = await Message.findById(messageId).populate('channel');
        if (!message || !message.channel) {
          socket.emit("error", { message: "Message not found or not in a channel" });
          return;
        }

        const channel = await Channel.findById(message.channel._id);
        const isAdmin = channel.admins.some(admin => admin.toString() === socket.userId);
        const isModerator = channel.moderators.some(mod => mod.toString() === socket.userId);

        if (!isAdmin && !isModerator) {
          socket.emit("error", { message: "Only admins and moderators can pin messages" });
          return;
        }

        message.isPinned = true;
        message.pinnedBy = socket.userId;
        message.pinnedAt = Date.now();
        await message.save();

        await message.populate('sender', 'name email profileImage');
        await message.populate('pinnedBy', 'name');

        io.to(`channel:${message.channel._id}`).emit("message:pinned", message);
      } catch (error) {
        console.error("Error pinning message:", error);
        socket.emit("error", { message: "Failed to pin message" });
      }
    });

    socket.on("message:unpin", async (messageId) => {
      try {
        const message = await Message.findById(messageId).populate('channel');
        if (!message || !message.channel) {
          socket.emit("error", { message: "Message not found or not in a channel" });
          return;
        }

        const channel = await Channel.findById(message.channel._id);
        const isAdmin = channel.admins.some(admin => admin.toString() === socket.userId);
        const isModerator = channel.moderators.some(mod => mod.toString() === socket.userId);

        if (!isAdmin && !isModerator) {
          socket.emit("error", { message: "Only admins and moderators can unpin messages" });
          return;
        }

        message.isPinned = false;
        message.pinnedBy = null;
        message.pinnedAt = null;
        await message.save();

        io.to(`channel:${message.channel._id}`).emit("message:unpinned", messageId);
      } catch (error) {
        console.error("Error unpinning message:", error);
        socket.emit("error", { message: "Failed to unpin message" });
      }
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.userId);
      users.delete(socket.userId);
      io.emit("user:offline", socket.userId);
    });
  });
};

module.exports = socketHandler;
