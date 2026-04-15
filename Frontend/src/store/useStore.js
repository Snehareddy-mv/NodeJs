import { create } from 'zustand';

const useStore = create((set, get) => ({
  user: JSON.parse(localStorage.getItem('user')) || null,
  accessToken: localStorage.getItem('accessToken') || null,
  
  channels: [],
  activeChannel: null,
  messages: [],
  
  users: [],
  onlineUsers: new Set(),
  typingUsers: new Set(),

  setUser: (user) => {
    localStorage.setItem('user', JSON.stringify(user));
    set({ user });
  },

  setAccessToken: (token) => {
    localStorage.setItem('accessToken', token);
    set({ accessToken: token });
  },

  logout: () => {
    localStorage.removeItem('user');
    localStorage.removeItem('accessToken');
    set({ user: null, accessToken: null, channels: [], messages: [] });
  },

  setChannels: (channels) => set({ channels }),

  setActiveChannel: (channel) => set({ activeChannel: channel, messages: [] }),

  addChannel: (channel) => set((state) => ({
    channels: [...state.channels, channel],
  })),

  updateChannel: (channelId, updates) => set((state) => ({
    channels: state.channels.map((ch) =>
      ch._id === channelId ? { ...ch, ...updates } : ch
    ),
  })),

  removeChannel: (channelId) => set((state) => ({
    channels: state.channels.filter((ch) => ch._id !== channelId),
    activeChannel: state.activeChannel?._id === channelId ? null : state.activeChannel,
  })),

  setMessages: (messages) => set({ messages }),

  addMessage: (message) => set((state) => ({
    messages: [...state.messages, message],
  })),

  updateMessage: (messageId, updates) => set((state) => ({
    messages: state.messages.map((msg) =>
      msg._id === messageId ? { ...msg, ...updates } : msg
    ),
  })),

  prependMessages: (messages) => set((state) => ({
    messages: [...messages, ...state.messages],
  })),

  deleteMessage: (messageId) => set((state) => ({
    messages: state.messages.filter((msg) => msg._id !== messageId),
  })),

  setUsers: (users) => set({ users }),

  addOnlineUser: (userId) => set((state) => {
    const newOnlineUsers = new Set(state.onlineUsers);
    newOnlineUsers.add(userId);
    return { onlineUsers: newOnlineUsers };
  }),

  removeOnlineUser: (userId) => set((state) => {
    const newOnlineUsers = new Set(state.onlineUsers);
    newOnlineUsers.delete(userId);
    return { onlineUsers: newOnlineUsers };
  }),

  addTypingUser: (userId) => set((state) => {
    const newTypingUsers = new Set(state.typingUsers);
    newTypingUsers.add(userId);
    return { typingUsers: newTypingUsers };
  }),

  removeTypingUser: (userId) => set((state) => {
    const newTypingUsers = new Set(state.typingUsers);
    newTypingUsers.delete(userId);
    return { typingUsers: newTypingUsers };
  }),
}));

export default useStore;
