const mongoose = require("mongoose");

const channelSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    default: "",
  },
  isPrivate: {
    type: Boolean,
    default: false,
  },
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  }],
  admins: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  }],
  moderators: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  inviteOnly: {
    type: Boolean,
    default: false,
  },
  inviteCode: {
    type: String,
    unique: true,
    sparse: true,
  },
  pendingInvites: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    invitedAt: {
      type: Date,
      default: Date.now,
    },
  }],
  lastActivity: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

channelSchema.index({ name: 1 });
channelSchema.index({ members: 1 });

const Channel = mongoose.model("Channel", channelSchema);

module.exports = Channel;
