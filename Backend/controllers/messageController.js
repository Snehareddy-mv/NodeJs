const Message = require("../models/messageModel");
const Channel = require("../models/channelModel");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");
const aiService = require("../services/aiService");

const sendMessage = asyncHandler(async (req, res) => {
  const { content, channelId, receiverId, messageType, fileUrl } = req.body;
  const senderId = req.currentUser.id;

  if (!content && !fileUrl) {
    throw new AppError("Message content or file is required", 400);
  }

  if (!channelId && !receiverId) {
    throw new AppError("Either channelId or receiverId is required", 400);
  }

  const messageData = {
    content,
    sender: senderId,
    messageType: messageType || "text",
    fileUrl,
  };

  if (channelId) {
    const channel = await Channel.findById(channelId);
    if (!channel) {
      throw new AppError("Channel not found", 404);
    }

    if (!channel.members.some((member) => member.toString() === senderId)) {
      throw new AppError("You are not a member of this channel", 403);
    }

    messageData.channel = channelId;
    channel.lastActivity = Date.now();
    await channel.save();
  } else {
    messageData.receiver = receiverId;
  }

  const message = await Message.create(messageData);
  await message.populate("sender", "name email profileImage");

  if (channelId) {
    await message.populate("channel", "name");
  }

  res.status(201).json({
    success: true,
    message: "Message sent successfully",
    data: message,
  });
});

const getChannelMessages = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  const { page = 1, limit = 50 } = req.query;
  const userId = req.currentUser.id;

  const channel = await Channel.findById(channelId);
  if (!channel) {
    throw new AppError("Channel not found", 404);
  }

  if (
    channel.isPrivate &&
    !channel.members.some((member) => member.toString() === userId)
  ) {
    throw new AppError("Access denied to private channel", 403);
  }

  const skip = (page - 1) * limit;

  const messages = await Message.find({ channel: channelId })
    .populate("sender", "name email profileImage")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const totalMessages = await Message.countDocuments({ channel: channelId });

  res.status(200).json({
    success: true,
    message: "Messages fetched successfully",
    page: parseInt(page),
    limit: parseInt(limit),
    totalMessages,
    totalPages: Math.ceil(totalMessages / limit),
    messages: messages.reverse(),
  });
});

const getDirectMessages = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { page = 1, limit = 50 } = req.query;
  const currentUserId = req.currentUser.id;

  const skip = (page - 1) * limit;

  const messages = await Message.find({
    $or: [
      { sender: currentUserId, receiver: userId },
      { sender: userId, receiver: currentUserId },
    ],
  })
    .populate("sender", "name email profileImage")
    .populate("receiver", "name email profileImage")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const totalMessages = await Message.countDocuments({
    $or: [
      { sender: currentUserId, receiver: userId },
      { sender: userId, receiver: currentUserId },
    ],
  });

  res.status(200).json({
    success: true,
    message: "Direct messages fetched successfully",
    page: parseInt(page),
    limit: parseInt(limit),
    totalMessages,
    totalPages: Math.ceil(totalMessages / limit),
    messages: messages.reverse(),
  });
});

const askAI = asyncHandler(async (req, res) => {
  const { prompt, question, channelId, silent } = req.body;
  const userId = req.currentUser.id;

  const userPrompt = prompt || question;

  if (!userPrompt) {
    throw new AppError("Prompt is required", 400);
  }

  let conversationHistory = [];

  if (channelId) {
   const recentMessages = await Message.find({ channel: channelId })
  .populate("sender", "_id")   // ✅ IMPORTANT
  .sort({ createdAt: -1 })
  .limit(20); // 🔥 increase history

  conversationHistory = recentMessages
  .reverse()
  .filter((msg) => msg.content && msg.content.trim() !== "")
  .map((msg) => {
    let role;

    // ✅ 1. AI messages
    if (msg.isAIMessage === true) {
      role = "assistant";
    }

    // ✅ 2. If sender matches current user
    else if (String(msg.sender) === String(userId) || msg.sender?._id?.toString() === String(userId)) {
      role = "user";
    }

    // ✅ 3. Everything else = assistant
    else {
      role = "assistant";
    }

    return {
      role,
      content: msg.content.trim(),
    };
  });
  }

  const aiResponse = await aiService.generateResponse(
    userPrompt,
    conversationHistory,
  );

  console.log("✅ AI Response generated:", aiResponse.substring(0, 100));

  // Silent mode: utility calls (translate, tone, autocomplete) — no DB save, no socket emit
  if (silent) {
    return res.status(200).json({
      success: true,
      message: "AI response generated successfully",
      data: { content: aiResponse },
    });
  }

  const aiMessage = await Message.create({
    content: aiResponse,
    sender: userId,
    channel: channelId,
    messageType: "ai",
    isAIMessage: true,
  });

  await aiMessage.populate("sender", "name email profileImage");

  console.log("✅ AI Message saved to DB:", aiMessage._id);

  const io = req.app.get("io");
  if (io && channelId) {
    io.to(`channel:${channelId}`).emit("message:new", aiMessage);
  }

  res.status(200).json({
    success: true,
    message: "AI response generated successfully",
    data: aiMessage,
  });
});

const summarizeConversation = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  const userId = req.currentUser.id;

  const channel = await Channel.findById(channelId);
  if (!channel) {
    throw new AppError("Channel not found", 404);
  }

  if (!channel.members.some((member) => member.toString() === userId)) {
    throw new AppError("You are not a member of this channel", 403);
  }

  const messages = await Message.find({ channel: channelId })
    .populate("sender", "name")
    .sort({ createdAt: -1 })
    .limit(50);

  if (messages.length === 0) {
    throw new AppError("No messages to summarize", 400);
  }

  const summary = await aiService.summarizeConversation(messages.reverse());

  res.status(200).json({
    success: true,
    message: "Conversation summarized successfully",
    summary,
  });
});

const generateSmartReply = asyncHandler(async (req, res) => {
  const { messageId } = req.params;

  const message = await Message.findById(messageId);
  if (!message) {
    throw new AppError("Message not found", 404);
  }

  const smartReply = await aiService.generateSmartReply(message.content);

  res.status(200).json({
    success: true,
    message: "Smart reply generated successfully",
    reply: smartReply,
  });
});

const deleteMessage = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.currentUser.id;

  const message = await Message.findById(id);

  if (!message) {
    throw new AppError("Message not found", 404);
  }

  if (message.sender.toString() !== userId) {
    throw new AppError("You can only delete your own messages", 403);
  }

  await Message.findByIdAndDelete(id);

  res.status(200).json({
    success: true,
    message: "Message deleted successfully",
  });
});

const editMessage = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { content } = req.body;
  const userId = req.currentUser.id;

  if (!content || !content.trim()) {
    throw new AppError("Message content is required", 400);
  }

  const message = await Message.findById(id);
  if (!message) {
    throw new AppError("Message not found", 404);
  }

  if (message.sender.toString() !== userId) {
    throw new AppError("You can only edit your own messages", 403);
  }

  message.content = content;
  message.isEdited = true;
  message.editedAt = Date.now();
  await message.save();

  await message.populate("sender", "name email profileImage");
  if (message.channel) {
    await message.populate("channel", "name");
  }

  res.status(200).json({
    success: true,
    message: "Message updated successfully",
    data: message,
  });
});

const pinMessage = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.currentUser.id;

  const message = await Message.findById(id).populate("channel");
  if (!message) {
    throw new AppError("Message not found", 404);
  }

  if (!message.channel) {
    throw new AppError("Only channel messages can be pinned", 400);
  }

  const channel = await Channel.findById(message.channel._id);
  const isAdmin = channel.admins.some((admin) => admin.toString() === userId);
  const isModerator = channel.moderators.some(
    (mod) => mod.toString() === userId,
  );

  if (!isAdmin && !isModerator) {
    throw new AppError("Only admins and moderators can pin messages", 403);
  }

  message.isPinned = true;
  message.pinnedBy = userId;
  message.pinnedAt = Date.now();
  await message.save();

  await message.populate("sender", "name email profileImage");
  await message.populate("pinnedBy", "name");

  res.status(200).json({
    success: true,
    message: "Message pinned successfully",
    data: message,
  });
});

const unpinMessage = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.currentUser.id;

  const message = await Message.findById(id).populate("channel");
  if (!message) {
    throw new AppError("Message not found", 404);
  }

  const channel = await Channel.findById(message.channel._id);
  const isAdmin = channel.admins.some((admin) => admin.toString() === userId);
  const isModerator = channel.moderators.some(
    (mod) => mod.toString() === userId,
  );

  if (!isAdmin && !isModerator) {
    throw new AppError("Only admins and moderators can unpin messages", 403);
  }

  message.isPinned = false;
  message.pinnedBy = null;
  message.pinnedAt = null;
  await message.save();

  res.status(200).json({
    success: true,
    message: "Message unpinned successfully",
    data: message,
  });
});

const searchMessages = asyncHandler(async (req, res) => {
  const { channelId, query, page = 1, limit = 20 } = req.query;
  const userId = req.currentUser.id;

  if (!query || !query.trim()) {
    throw new AppError("Search query is required", 400);
  }

  const searchQuery = {
    content: { $regex: query, $options: "i" },
  };

  if (channelId) {
    const channel = await Channel.findById(channelId);
    if (!channel) {
      throw new AppError("Channel not found", 404);
    }

    if (!channel.members.some((member) => member.toString() === userId)) {
      throw new AppError("You are not a member of this channel", 403);
    }

    searchQuery.channel = channelId;
  } else {
    searchQuery.$or = [{ sender: userId }, { receiver: userId }];
  }

  const skip = (page - 1) * limit;

  const messages = await Message.find(searchQuery)
    .populate("sender", "name email profileImage")
    .populate("channel", "name")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Message.countDocuments(searchQuery);

  res.status(200).json({
    success: true,
    data: {
      messages,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    },
  });
});

const getPinnedMessages = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  const userId = req.currentUser.id;

  const channel = await Channel.findById(channelId);
  if (!channel) {
    throw new AppError("Channel not found", 404);
  }

  if (!channel.members.some((member) => member.toString() === userId)) {
    throw new AppError("You are not a member of this channel", 403);
  }

  const pinnedMessages = await Message.find({
    channel: channelId,
    isPinned: true,
  })
    .populate("sender", "name email profileImage")
    .populate("pinnedBy", "name")
    .sort({ pinnedAt: -1 });

  res.status(200).json({
    success: true,
    data: pinnedMessages,
  });
});

module.exports = {
  sendMessage,
  getChannelMessages,
  getDirectMessages,
  askAI,
  summarizeConversation,
  generateSmartReply,
  deleteMessage,
  editMessage,
  pinMessage,
  unpinMessage,
  searchMessages,
  getPinnedMessages,
};
