const Channel = require("../models/channelModel");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");

const createChannel = asyncHandler(async (req, res) => {
  const { name, description, isPrivate, members } = req.body;

  if (!name) {
    throw new AppError("Channel name is required", 400);
  }

  const existingChannel = await Channel.findOne({ name });
  if (existingChannel) {
    throw new AppError("Channel with this name already exists", 400);
  }

  const channel = await Channel.create({
    name,
    description,
    isPrivate: isPrivate || false,
    members: members || [req.currentUser.id],
    admins: [req.currentUser.id],
    createdBy: req.currentUser.id,
  });

  await channel.populate('members', 'name email profileImage');
  await channel.populate('createdBy', 'name email');
  await channel.populate('admins', 'name email');
  await channel.populate('moderators', 'name email');

  res.status(201).json({
    success: true,
    message: "Channel created successfully",
    channel,
  });
});

const getAllChannels = asyncHandler(async (req, res) => {
  const userId = req.currentUser.id;

  console.log('Getting channels for user:', userId);

  // Only return channels where user is a member
  const channels = await Channel.find({
    members: userId,
  })
    .populate('members', 'name email profileImage')
    .populate('createdBy', 'name email')
    .populate('admins', 'name email')
    .populate('moderators', 'name email')
    .sort({ lastActivity: -1 });

  console.log('Found channels:', channels.length);
  console.log('Channel names:', channels.map(c => c.name));

  res.status(200).json({
    success: true,
    channels,
  });
});

const getChannelById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.currentUser.id;

  const channel = await Channel.findById(id)
    .populate('members', 'name email profileImage')
    .populate('admins', 'name email')
    .populate('createdBy', 'name email');

  if (!channel) {
    throw new AppError("Channel not found", 404);
  }

  if (channel.isPrivate && !channel.members.some(member => member._id.toString() === userId)) {
    throw new AppError("Access denied to private channel", 403);
  }

  res.status(200).json({
    success: true,
    message: "Channel fetched successfully",
    channel,
  });
});

const updateChannel = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, description, isPrivate } = req.body;
  const userId = req.currentUser.id;

  const channel = await Channel.findById(id);

  if (!channel) {
    throw new AppError("Channel not found", 404);
  }

  if (!channel.admins.some(admin => admin.toString() === userId)) {
    throw new AppError("Only channel admins can update the channel", 403);
  }

  if (name) channel.name = name;
  if (description !== undefined) channel.description = description;
  if (isPrivate !== undefined) channel.isPrivate = isPrivate;

  await channel.save();
  await channel.populate('members', 'name email profileImage');

  res.status(200).json({
    success: true,
    message: "Channel updated successfully",
    channel,
  });
});

const deleteChannel = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.currentUser.id;

  const channel = await Channel.findById(id);

  if (!channel) {
    throw new AppError("Channel not found", 404);
  }

  if (channel.createdBy.toString() !== userId) {
    throw new AppError("Only channel creator can delete the channel", 403);
  }

  await Channel.findByIdAndDelete(id);

  res.status(200).json({
    success: true,
    message: "Channel deleted successfully",
  });
});

const addMemberToChannel = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { userId: newMemberId } = req.body;
  const currentUserId = req.currentUser.id;

  const channel = await Channel.findById(id);

  if (!channel) {
    throw new AppError("Channel not found", 404);
  }

  if (!channel.admins.some(admin => admin.toString() === currentUserId)) {
    throw new AppError("Only channel admins can add members", 403);
  }

  if (channel.members.some(member => member.toString() === newMemberId)) {
    throw new AppError("User is already a member", 400);
  }

  channel.members.push(newMemberId);
  await channel.save();
  await channel.populate('members', 'name email profileImage');

  res.status(200).json({
    success: true,
    message: "Member added successfully",
    channel,
  });
});

const removeMemberFromChannel = asyncHandler(async (req, res) => {
  const { id, userId } = req.params;
  const currentUserId = req.currentUser.id;

  const channel = await Channel.findById(id);

  if (!channel) {
    throw new AppError("Channel not found", 404);
  }

  if (!channel.admins.some(admin => admin.toString() === currentUserId)) {
    throw new AppError("Only channel admins can remove members", 403);
  }

  channel.members = channel.members.filter(member => member.toString() !== userId);
  await channel.save();
  await channel.populate('members', 'name email profileImage');

  res.status(200).json({
    success: true,
    message: "Member removed successfully",
    channel,
  });
});

const generateInviteCode = () => {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
};

const createInviteCode = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.currentUser.id;

  const channel = await Channel.findById(id);
  if (!channel) {
    throw new AppError("Channel not found", 404);
  }

  const isAdmin = channel.admins.some(admin => admin.toString() === userId);
  if (!isAdmin) {
    throw new AppError("Only admins can create invite codes", 403);
  }

  channel.inviteOnly = true;
  channel.inviteCode = generateInviteCode();
  await channel.save();

  res.status(200).json({
    success: true,
    message: "Invite code created successfully",
    data: {
      inviteCode: channel.inviteCode,
    },
  });
});

const joinWithInviteCode = asyncHandler(async (req, res) => {
  const { inviteCode } = req.body;
  const userId = req.currentUser.id;

  if (!inviteCode) {
    throw new AppError("Invite code is required", 400);
  }

  // Trim and convert to uppercase for case-insensitive matching
  const cleanCode = inviteCode.trim().toUpperCase();
  console.log('Looking for invite code:', cleanCode);

  const channel = await Channel.findOne({ inviteCode: cleanCode });
  console.log('Found channel:', channel ? channel.name : 'null');
  
  if (!channel) {
    throw new AppError("Invalid invite code", 404);
  }

  if (channel.members.some(member => member.toString() === userId)) {
    throw new AppError("You are already a member of this channel", 400);
  }

  channel.members.push(userId);
  await channel.save();

  await channel.populate('members', 'name email profileImage');
  await channel.populate('admins', 'name email');
  await channel.populate('moderators', 'name email');

  res.status(200).json({
    success: true,
    message: "Joined channel successfully",
    channel,
  });
});

const inviteUserToChannel = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { userId: invitedUserId } = req.body;
  const userId = req.currentUser.id;

  const channel = await Channel.findById(id);
  if (!channel) {
    throw new AppError("Channel not found", 404);
  }

  const isAdmin = channel.admins.some(admin => admin.toString() === userId);
  const isModerator = channel.moderators.some(mod => mod.toString() === userId);

  if (!isAdmin && !isModerator) {
    throw new AppError("Only admins and moderators can invite users", 403);
  }

  if (channel.members.some(member => member.toString() === invitedUserId)) {
    throw new AppError("User is already a member", 400);
  }

  const existingInvite = channel.pendingInvites.find(
    invite => invite.user.toString() === invitedUserId
  );

  if (existingInvite) {
    throw new AppError("User already has a pending invite", 400);
  }

  channel.pendingInvites.push({
    user: invitedUserId,
    invitedBy: userId,
  });

  await channel.save();

  res.status(200).json({
    success: true,
    message: "User invited successfully",
  });
});

const acceptInvite = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.currentUser.id;

  const channel = await Channel.findById(id);
  if (!channel) {
    throw new AppError("Channel not found", 404);
  }

  const inviteIndex = channel.pendingInvites.findIndex(
    invite => invite.user.toString() === userId
  );

  if (inviteIndex === -1) {
    throw new AppError("No pending invite found", 404);
  }

  channel.pendingInvites.splice(inviteIndex, 1);
  channel.members.push(userId);
  await channel.save();

  await channel.populate('members', 'name email profileImage');

  res.status(200).json({
    success: true,
    message: "Invite accepted successfully",
    channel,
  });
});

const promoteToModerator = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { userId: targetUserId } = req.body;
  const userId = req.currentUser.id;

  const channel = await Channel.findById(id);
  if (!channel) {
    throw new AppError("Channel not found", 404);
  }

  const isAdmin = channel.admins.some(admin => admin.toString() === userId);
  if (!isAdmin) {
    throw new AppError("Only admins can promote users to moderator", 403);
  }

  if (!channel.members.some(member => member.toString() === targetUserId)) {
    throw new AppError("User is not a member of this channel", 400);
  }

  if (channel.moderators.some(mod => mod.toString() === targetUserId)) {
    throw new AppError("User is already a moderator", 400);
  }

  channel.moderators.push(targetUserId);
  await channel.save();

  await channel.populate('moderators', 'name email');

  res.status(200).json({
    success: true,
    message: "User promoted to moderator successfully",
    channel,
  });
});

const promoteToAdmin = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { userId: targetUserId } = req.body;
  const userId = req.currentUser.id;

  const channel = await Channel.findById(id);
  if (!channel) {
    throw new AppError("Channel not found", 404);
  }

  const isAdmin = channel.admins.some(admin => admin.toString() === userId);
  if (!isAdmin) {
    throw new AppError("Only admins can promote users to admin", 403);
  }

  if (!channel.members.some(member => member.toString() === targetUserId)) {
    throw new AppError("User is not a member of this channel", 400);
  }

  if (channel.admins.some(admin => admin.toString() === targetUserId)) {
    throw new AppError("User is already an admin", 400);
  }

  channel.admins.push(targetUserId);
  channel.moderators = channel.moderators.filter(
    mod => mod.toString() !== targetUserId
  );
  await channel.save();

  await channel.populate('admins', 'name email');

  res.status(200).json({
    success: true,
    message: "User promoted to admin successfully",
    channel,
  });
});

const demoteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { userId: targetUserId } = req.body;
  const userId = req.currentUser.id;

  const channel = await Channel.findById(id);
  if (!channel) {
    throw new AppError("Channel not found", 404);
  }

  const isAdmin = channel.admins.some(admin => admin.toString() === userId);
  if (!isAdmin) {
    throw new AppError("Only admins can demote users", 403);
  }

  channel.admins = channel.admins.filter(admin => admin.toString() !== targetUserId);
  channel.moderators = channel.moderators.filter(mod => mod.toString() !== targetUserId);
  await channel.save();

  res.status(200).json({
    success: true,
    message: "User demoted successfully",
    channel,
  });
});

module.exports = {
  createChannel,
  getAllChannels,
  getChannelById,
  updateChannel,
  deleteChannel,
  addMemberToChannel,
  removeMemberFromChannel,
  createInviteCode,
  joinWithInviteCode,
  inviteUserToChannel,
  acceptInvite,
  promoteToModerator,
  promoteToAdmin,
  demoteUser,
};
