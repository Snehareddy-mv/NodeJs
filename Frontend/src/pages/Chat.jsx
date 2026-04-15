import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useStore from '../store/useStore';
import socketService from '../services/socket';
import { channelAPI, messageAPI } from '../services/api';
import toast from 'react-hot-toast';

function Chat() {
  const navigate = useNavigate();
  const { user, accessToken, channels, activeChannel, messages, setChannels, setActiveChannel, setMessages, addMessage, updateMessage, deleteMessage, logout } = useStore();
  
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editText, setEditText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearch, setShowSearch] = useState(false);
  const [pinnedMessages, setPinnedMessages] = useState([]);
  const [showPinned, setShowPinned] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [joinCode, setJoinCode] = useState('');

  useEffect(() => {
    if (!accessToken) {
      navigate('/login');
      return;
    }

    console.log('🔌 Connecting to Socket.io...');
    socketService.connect(accessToken);
    loadChannels();

    return () => {
      console.log('🔌 Disconnecting from Socket.io...');
      socketService.disconnect();
    };
  }, []);

  useEffect(() => {
    const handleNewMessage = (message) => {
      console.log('📨 New message received:', message);
      
      const messageChannelId = typeof message.channel === 'object' ? message.channel._id : message.channel;
      const currentChannelId = activeChannel?._id;
      
      console.log('Message channel ID:', messageChannelId);
      console.log('Current channel ID:', currentChannelId);
      
      if (messageChannelId === currentChannelId) {
        console.log('✅ Adding message to UI');
        addMessage(message);
      } else {
        console.log('❌ Message not for current channel, ignoring');
      }
    };

    const handleMessageEdited = (message) => {
      console.log('✏️ Message edited:', message);
      updateMessage(message._id, message);
    };

    const handleMessagePinned = (message) => {
      console.log('📌 Message pinned:', message);
      updateMessage(message._id, message);
      toast.success('Message pinned');
    };

    const handleMessageUnpinned = (messageId) => {
      console.log('📌 Message unpinned:', messageId);
      updateMessage(messageId, { isPinned: false, pinnedBy: null, pinnedAt: null });
      toast.success('Message unpinned');
    };

    const handleMessageDeleted = (messageId) => {
      console.log('🗑️ Message deleted:', messageId);
      deleteMessage(messageId);
    };

    console.log('🎧 Setting up message listeners for channel:', activeChannel?._id);
    socketService.onNewMessage(handleNewMessage);
    socketService.onMessageEdited(handleMessageEdited);
    socketService.onMessagePinned(handleMessagePinned);
    socketService.onMessageUnpinned(handleMessageUnpinned);
    socketService.onMessageDeleted(handleMessageDeleted);

    return () => {
      console.log('🔇 Removing message listeners');
      socketService.off('message:new');
      socketService.off('message:edited');
      socketService.off('message:pinned');
      socketService.off('message:unpinned');
      socketService.off('message:deleted');
    };
  }, [activeChannel]);

  useEffect(() => {
    if (activeChannel) {
      console.log('Switching to channel:', activeChannel.name, activeChannel._id);
      loadMessages(activeChannel._id);
      socketService.joinChannel(activeChannel._id);
    }
  }, [activeChannel]);

  const loadChannels = async () => {
    try {
      const response = await channelAPI.getAll();
      setChannels(response.data.channels);
    } catch (error) {
      toast.error('Failed to load channels');
    }
  };

  const loadMessages = async (channelId) => {
    try {
      const response = await messageAPI.getChannelMessages(channelId);
      setMessages(response.data.messages);
    } catch (error) {
      toast.error('Failed to load messages');
    }
  };

  const handleCreateChannel = async (e) => {
    e.preventDefault();
    if (!newChannelName.trim()) return;

    try {
      const response = await channelAPI.create({ name: newChannelName, description: '' });
      setChannels([...channels, response.data.channel]);
      setNewChannelName('');
      setShowCreateChannel(false);
      toast.success('Channel created!');
    } catch (error) {
      toast.error('Failed to create channel');
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageText.trim() || !activeChannel) return;

    const messageContent = messageText;
    setMessageText('');
    setLoading(true);

    try {
      socketService.sendMessage({
        content: messageContent,
        channelId: activeChannel._id,
        messageType: 'text',
      });
    } catch (error) {
      toast.error('Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  const handleEditMessage = async (messageId) => {
    if (!editText.trim()) return;

    try {
      await messageAPI.edit(messageId, { content: editText });
      socketService.editMessage(messageId, editText);
      setEditingMessageId(null);
      setEditText('');
      toast.success('Message updated');
    } catch (error) {
      toast.error('Failed to edit message');
    }
  };

  const handlePinMessage = async (messageId) => {
    try {
      await messageAPI.pin(messageId);
      socketService.pinMessage(messageId);
      toast.success('Message pinned');
    } catch (error) {
      console.error('Pin error:', error);
      toast.error(error.response?.data?.message || 'Failed to pin message');
    }
  };

  const handleUnpinMessage = async (messageId) => {
    try {
      await messageAPI.unpin(messageId);
      socketService.unpinMessage(messageId);
      toast.success('Message unpinned');
    } catch (error) {
      console.error('Unpin error:', error);
      toast.error(error.response?.data?.message || 'Failed to unpin message');
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    try {
      console.log('Searching for:', searchQuery, 'in channel:', activeChannel?._id);
      const response = await messageAPI.search(searchQuery, activeChannel?._id);
      console.log('Search response:', response);
      console.log('Search results messages:', response.data.data.messages);
      console.log('Number of results:', response.data.data.messages.length);
      setSearchResults(response.data.data.messages);
      
      if (response.data.data.messages.length === 0) {
        toast.info('No messages found');
      } else {
        toast.success(`Found ${response.data.data.messages.length} message(s)`);
      }
    } catch (error) {
      console.error('Search error:', error);
      toast.error(error.response?.data?.message || 'Search failed');
    }
  };

  const loadPinnedMessages = async () => {
    if (!activeChannel) return;

    try {
      console.log('Loading pinned messages for channel:', activeChannel._id);
      const response = await messageAPI.getPinned(activeChannel._id);
      console.log('Pinned messages response:', response);
      setPinnedMessages(response.data.data);
      setShowPinned(true);
      toast.success(`Found ${response.data.data.length} pinned messages`);
    } catch (error) {
      console.error('Load pinned error:', error);
      toast.error(error.response?.data?.message || 'Failed to load pinned messages');
    }
  };

  const handleCreateInviteCode = async () => {
    if (!activeChannel) return;

    try {
      console.log('Creating invite code for channel:', activeChannel._id);
      console.log('Active channel data:', activeChannel);
      console.log('Current user ID:', user.id);
      console.log('Channel admins:', activeChannel.admins);
      
      const response = await channelAPI.createInviteCode(activeChannel._id);
      console.log('Invite code response:', response);
      setInviteCode(response.data.data.inviteCode);
      setShowInviteModal(true);
      toast.success('Invite code created!');
    } catch (error) {
      console.error('Create invite error:', error);
      console.error('Error response:', error.response?.data);
      toast.error(error.response?.data?.message || 'Failed to create invite code');
    }
  };

  const handleJoinWithCode = async () => {
    if (!joinCode.trim()) return;

    try {
      console.log('Attempting to join with code:', joinCode);
      console.log('Code length:', joinCode.length);
      console.log('Code trimmed:', joinCode.trim());
      
      const response = await channelAPI.joinWithCode(joinCode.trim().toUpperCase());
      console.log('Join response:', response);
      
      setChannels([...channels, response.data.channel]);
      setJoinCode('');
      toast.success(`Joined ${response.data.channel.name} successfully!`);
      loadChannels(); // Reload channels to get updated list
    } catch (error) {
      console.error('Join with code error:', error);
      console.error('Error response:', error.response?.data);
      toast.error(error.response?.data?.message || 'Failed to join channel');
    }
  };

  const handleLogout = () => {
    socketService.disconnect();
    logout();
    navigate('/login');
  };

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      {/* Sidebar */}
      <div style={{ width: '250px', background: '#1f2937', color: 'white', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '1rem', borderBottom: '1px solid #374151' }}>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>ChatGenius</h1>
          <p style={{ fontSize: '0.875rem', color: '#9ca3af' }}>{user?.name}</p>
        </div>

        <div style={{ padding: '1rem', borderBottom: '1px solid #374151' }}>
          <button
            onClick={() => setShowCreateChannel(!showCreateChannel)}
            style={{ width: '100%', padding: '0.5rem', background: '#3b82f6', border: 'none', borderRadius: '4px', color: 'white', cursor: 'pointer' }}
          >
            + New Channel
          </button>
          
          {showCreateChannel && (
            <form onSubmit={handleCreateChannel} style={{ marginTop: '0.5rem' }}>
              <input
                type="text"
                value={newChannelName}
                onChange={(e) => setNewChannelName(e.target.value)}
                placeholder="Channel name"
                style={{ width: '100%', padding: '0.5rem', marginBottom: '0.5rem', borderRadius: '4px', border: '1px solid #374151' }}
              />
              <button type="submit" style={{ width: '100%', padding: '0.5rem', background: '#10b981', border: 'none', borderRadius: '4px', color: 'white', cursor: 'pointer' }}>
                Create
              </button>
            </form>
          )}
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
          <h3 style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem', color: '#9ca3af' }}>CHANNELS</h3>
          {channels.map((channel) => (
            <div
              key={channel._id}
              onClick={() => setActiveChannel(channel)}
              style={{
                padding: '0.5rem',
                marginBottom: '0.25rem',
                borderRadius: '4px',
                cursor: 'pointer',
                background: activeChannel?._id === channel._id ? '#374151' : 'transparent',
              }}
            >
              # {channel.name}
            </div>
          ))}
        </div>

        <div style={{ padding: '1rem', borderTop: '1px solid #374151' }}>
          <button
            onClick={handleLogout}
            style={{ width: '100%', padding: '0.5rem', background: '#ef4444', border: 'none', borderRadius: '4px', color: 'white', cursor: 'pointer' }}
          >
            Logout
          </button>
        </div>
      </div>

      {/* Main Chat Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#f9fafb' }}>
        {activeChannel ? (
          <>
            <div style={{ padding: '1rem', background: 'white', borderBottom: '1px solid #e5e7eb' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>#{activeChannel.name}</h2>
                  <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>{activeChannel.description || 'No description'}</p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button onClick={loadPinnedMessages} style={{ padding: '0.5rem 1rem', background: '#8b5cf6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.875rem' }}>
                    📌 Pinned
                  </button>
                  <button onClick={() => setShowSearch(!showSearch)} style={{ padding: '0.5rem 1rem', background: '#06b6d4', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.875rem' }}>
                    🔍 Search
                  </button>
                  <button onClick={handleCreateInviteCode} style={{ padding: '0.5rem 1rem', background: '#10b981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.875rem' }}>
                    🔗 Invite
                  </button>
                </div>
              </div>

              {showSearch && (
                <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search messages..."
                    style={{ flex: 1, padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '4px' }}
                  />
                  <button onClick={handleSearch} style={{ padding: '0.5rem 1rem', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                    Search
                  </button>
                </div>
              )}
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
              {messages.map((message) => (
                <div key={message._id} style={{ marginBottom: '1rem', padding: '0.75rem', background: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <span style={{ fontWeight: '600', marginRight: '0.5rem' }}>{message.sender.name}</span>
                      <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                        {new Date(message.createdAt).toLocaleTimeString()}
                      </span>
                      {message.isEdited && <span style={{ fontSize: '0.75rem', color: '#9ca3af', marginLeft: '0.5rem' }}>(edited)</span>}
                      {message.isPinned && <span style={{ fontSize: '0.75rem', marginLeft: '0.5rem' }}>📌</span>}
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {message.sender._id === user.id && (
                        <button
                          onClick={() => {
                            setEditingMessageId(message._id);
                            setEditText(message.content);
                          }}
                          style={{ padding: '0.25rem 0.5rem', background: '#f59e0b', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem' }}
                        >
                          ✏️ Edit
                        </button>
                      )}
                      {/* Only show pin/unpin to admins and moderators */}
                      {activeChannel && (
                        activeChannel.admins?.some(admin => admin._id === user.id) || 
                        activeChannel.moderators?.some(mod => mod._id === user.id)
                      ) && (
                        message.isPinned ? (
                          <button onClick={() => handleUnpinMessage(message._id)} style={{ padding: '0.25rem 0.5rem', background: '#6b7280', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem' }}>
                            Unpin
                          </button>
                        ) : (
                          <button onClick={() => handlePinMessage(message._id)} style={{ padding: '0.25rem 0.5rem', background: '#8b5cf6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem' }}>
                            📌 Pin
                          </button>
                        )
                      )}
                    </div>
                  </div>
                  
                  {editingMessageId === message._id ? (
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                      <input
                        type="text"
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        style={{ flex: 1, padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '4px' }}
                      />
                      <button onClick={() => handleEditMessage(message._id)} style={{ padding: '0.5rem 1rem', background: '#10b981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                        Save
                      </button>
                      <button onClick={() => setEditingMessageId(null)} style={{ padding: '0.5rem 1rem', background: '#6b7280', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div style={{ color: '#374151' }}>{message.content}</div>
                  )}
                </div>
              ))}
            </div>

            <div style={{ padding: '1rem', background: 'white', borderTop: '1px solid #e5e7eb' }}>
              <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder={`Message #${activeChannel.name}`}
                  style={{ flex: 1, padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '4px' }}
                />
                <button
                  type="submit"
                  disabled={loading || !messageText.trim()}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: loading || !messageText.trim() ? '#9ca3af' : '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: loading || !messageText.trim() ? 'not-allowed' : 'pointer',
                  }}
                >
                  Send
                </button>
              </form>
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280' }}>
            <div style={{ textAlign: 'center' }}>
              <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Welcome to ChatGenius!</h2>
              <p>Select a channel to start chatting</p>
            </div>
          </div>
        )}
      </div>

      {/* Pinned Messages Modal */}
      {showPinned && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', padding: '2rem', borderRadius: '8px', maxWidth: '600px', width: '90%', maxHeight: '80vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>📌 Pinned Messages</h3>
              <button onClick={() => setShowPinned(false)} style={{ padding: '0.5rem', background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                Close
              </button>
            </div>
            {pinnedMessages.length > 0 ? (
              pinnedMessages.map((msg) => (
                <div key={msg._id} style={{ padding: '1rem', background: '#f9fafb', borderRadius: '8px', marginBottom: '0.5rem' }}>
                  <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>{msg.sender.name}</div>
                  <div style={{ color: '#374151' }}>{msg.content}</div>
                  <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                    {new Date(msg.createdAt).toLocaleString()}
                  </div>
                </div>
              ))
            ) : (
              <p style={{ color: '#6b7280', textAlign: 'center' }}>No pinned messages</p>
            )}
          </div>
        </div>
      )}

      {/* Search Results Modal */}
      {searchResults.length > 0 && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', padding: '2rem', borderRadius: '8px', maxWidth: '600px', width: '90%', maxHeight: '80vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>🔍 Search Results ({searchResults.length})</h3>
              <button onClick={() => setSearchResults([])} style={{ padding: '0.5rem', background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                Close
              </button>
            </div>
            {searchResults.map((msg) => (
              <div key={msg._id} style={{ padding: '1rem', background: '#f9fafb', borderRadius: '8px', marginBottom: '0.5rem' }}>
                <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>{msg.sender.name}</div>
                <div style={{ color: '#374151' }}>{msg.content}</div>
                <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                  {new Date(msg.createdAt).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Invite Code Modal */}
      {showInviteModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', padding: '2rem', borderRadius: '8px', maxWidth: '400px', width: '90%' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>🔗 Channel Invite Code</h3>
            <p style={{ marginBottom: '1rem', color: '#6b7280' }}>Share this code with others to invite them to this channel:</p>
            <div style={{ padding: '1rem', background: '#f9fafb', borderRadius: '8px', marginBottom: '1rem', textAlign: 'center', fontSize: '1.5rem', fontWeight: 'bold', letterSpacing: '0.1em' }}>
              {inviteCode}
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(inviteCode);
                  toast.success('Invite code copied!');
                }}
                style={{ flex: 1, padding: '0.75rem', background: '#10b981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
              >
                Copy Code
              </button>
              <button onClick={() => setShowInviteModal(false)} style={{ flex: 1, padding: '0.75rem', background: '#6b7280', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Join with Code Section in Sidebar */}
      <div style={{ position: 'fixed', bottom: '80px', left: '10px', right: 'auto', width: '230px', background: '#374151', padding: '1rem', borderRadius: '8px' }}>
        <h4 style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem', color: 'white' }}>Join with Code</h4>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <input
            type="text"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value)}
            placeholder="Enter code"
            style={{ flex: 1, padding: '0.5rem', borderRadius: '4px', border: '1px solid #4b5563', fontSize: '0.875rem' }}
          />
          <button onClick={handleJoinWithCode} style={{ padding: '0.5rem', background: '#10b981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.875rem' }}>
            Join
          </button>
        </div>
      </div>
    </div>
  );
}

export default Chat;
