import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import useStore from "../store/useStore";
import socketService from "../services/socket";
import { channelAPI, messageAPI } from "../services/api";
import toast from "react-hot-toast";

function Chat() {
  // Theme Constants
  const ACCENT = "#6366f1";
  const BG = "#e6ebf2";
  const CARD = "#ffffff";
  const BORDER = "#e5e7eb";
  const TEXT = "#1f2937";
  const SUBTEXT = "#6b7280";

  // Dark Sidebar Theme
  const SIDEBAR_BG = "#0f1419";
  const SIDEBAR_CARD = "#1a1f2e";
  const SIDEBAR_BORDER = "#2d3748";
  const SIDEBAR_TEXT = "#e2e8f0";
  const SIDEBAR_SUBTEXT = "#a0aec0";
  const SIDEBAR_ACCENT = "#2f855a"; // classy green

  const softShadow = "4px 4px 12px #d3d9e2, -4px -4px 12px #ffffff";
  const insetShadow = "inset 2px 2px 5px #d3d9e2, inset -2px -2px 5px #ffffff";
  const darkSoftShadow =
    "4px 4px 12px rgba(0,0,0,0.3), -4px -4px 12px rgba(255,255,255,0.08)";
  const darkInsetShadow =
    "inset 2px 2px 5px rgba(0,0,0,0.3), inset -2px -2px 5px rgba(255,255,255,0.08)";

  const navigate = useNavigate();
  const {
    user,
    accessToken,
    channels,
    activeChannel,
    messages,
    setChannels,
    setActiveChannel,
    setMessages,
    addMessage,
    updateMessage,
    deleteMessage,
    logout,
  } = useStore();

  const [messageText, setMessageText] = useState("");
  const [loading, setLoading] = useState(false);
  const [newChannelName, setNewChannelName] = useState("");
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editText, setEditText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showSearch, setShowSearch] = useState(false);
  const [pinnedMessages, setPinnedMessages] = useState([]);
  const [showPinned, setShowPinned] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteCode, setInviteCode] = useState("");
  const [joinCode, setJoinCode] = useState("");

  // AI Assistant states
  const [showAIChat, setShowAIChat] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiHistory, setAiHistory] = useState([]);

  const aiHistoryEndRef = useRef(null);
  const suggestionJustAccepted = useRef(false);

  // Inline autocomplete states
  const [typingSuggestion, setTypingSuggestion] = useState("");
  const [suggestionLoading, setSuggestionLoading] = useState(false);

  // Tone Rewrite states
  const [showToneMenu, setShowToneMenu] = useState(false);
  const [toneLoading, setToneLoading] = useState(false);

  // Translation states
  const [showTranslateFor, setShowTranslateFor] = useState(null);
  const [pendingTranslations, setPendingTranslations] = useState({});
  const [acceptedTranslations, setAcceptedTranslations] = useState({});

  useEffect(() => {
    if (!accessToken) {
      navigate("/login");
      return;
    }

    console.log("🔌 Connecting to Socket.io...");
    socketService.connect(accessToken);
    loadChannels();

    return () => {
      console.log("🔌 Disconnecting from Socket.io...");
      socketService.disconnect();
    };
  }, []);

  useEffect(() => {
    const handleNewMessage = (message) => {
      console.log("📨 New message received:", message);

      const messageChannelId =
        typeof message.channel === "object"
          ? message.channel._id
          : message.channel;
      const currentChannelId = activeChannel?._id;

      console.log("Message channel ID:", messageChannelId);
      console.log("Current channel ID:", currentChannelId);

      if (messageChannelId === currentChannelId) {
        console.log("✅ Adding message to UI");
        addMessage(message);
      } else {
        console.log("❌ Message not for current channel, ignoring");
      }
    };

    const handleMessageEdited = (message) => {
      console.log("✏️ Message edited:", message);
      updateMessage(message._id, message);
    };

    const handleMessagePinned = (message) => {
      console.log("📌 Message pinned:", message);
      updateMessage(message._id, message);
    };
    const btn = () => ({
      padding: "0.4rem 0.9rem",
      borderRadius: "8px",
      border: "none",
      background: "#ffffff",
      boxShadow: "2px 2px 6px #d3d9e2, -2px -2px 6px #ffffff",
      cursor: "pointer",
    });

    const handleMessageUnpinned = (messageId) => {
      console.log("📌 Message unpinned:", messageId);
      updateMessage(messageId, {
        isPinned: false,
        pinnedBy: null,
        pinnedAt: null,
      });
    };

    const handleMessageDeleted = (messageId) => {
      console.log("🗑️ Message deleted:", messageId);
      deleteMessage(messageId);
    };

    console.log(
      "🎧 Setting up message listeners for channel:",
      activeChannel?._id,
    );
    socketService.onNewMessage(handleNewMessage);
    socketService.onMessageEdited(handleMessageEdited);
    socketService.onMessagePinned(handleMessagePinned);
    socketService.onMessageUnpinned(handleMessageUnpinned);
    socketService.onMessageDeleted(handleMessageDeleted);

    return () => {
      console.log("🔇 Removing message listeners");
      socketService.off("message:new");
      socketService.off("message:edited");
      socketService.off("message:pinned");
      socketService.off("message:unpinned");
      socketService.off("message:deleted");
    };
  }, [activeChannel]);

  useEffect(() => {
    if (activeChannel) {
      console.log(
        "Switching to channel:",
        activeChannel.name,
        activeChannel._id,
      );
      loadMessages(activeChannel._id);
      socketService.joinChannel(activeChannel._id);
    }
  }, [activeChannel]);

  const loadChannels = async () => {
    try {
      const response = await channelAPI.getAll();
      setChannels(response.data.channels);
    } catch (error) {
      toast.error("Failed to load channels");
    }
  };

  const loadMessages = async (channelId) => {
    try {
      const response = await messageAPI.getChannelMessages(channelId);
      setMessages(response.data.messages);
    } catch (error) {
      toast.error("Failed to load messages");
    }
  };

  const handleCreateChannel = async (e) => {
    e.preventDefault();
    if (!newChannelName.trim()) return;

    try {
      const response = await channelAPI.create({
        name: newChannelName,
        description: "",
      });
      setChannels([...channels, response.data.channel]);
      setNewChannelName("");
      setShowCreateChannel(false);
      toast.success("Channel created!");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create channel");
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageText.trim() || !activeChannel) return;

    // Route @ai or /ask to the AI assistant
    const aiMatch = messageText.trim().match(/^(@ai|\/ask)\s+([\s\S]+)/i);
    if (aiMatch) {
      const prompt = aiMatch[2].trim();
      setMessageText("");
      setShowAIChat(true);
      await handleAskAIWithPrompt(prompt);
      return;
    }

    const messageContent = messageText;
    setMessageText("");
    setLoading(true);

    try {
      socketService.sendMessage({
        content: messageContent,
        channelId: activeChannel._id,
        messageType: "text",
      });
    } catch (error) {
      toast.error("Failed to send message");
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
      setEditText("");
      toast.success("Message updated");
    } catch (error) {
      toast.error("Failed to edit message");
    }
  };

  const handlePinMessage = async (messageId) => {
    try {
      await messageAPI.pin(messageId);
      socketService.pinMessage(messageId);
      toast.success("Message pinned");
    } catch (error) {
      console.error("Pin error:", error);
      toast.error(error.response?.data?.message || "Failed to pin message");
    }
  };

  const handleUnpinMessage = async (messageId) => {
    try {
      await messageAPI.unpin(messageId);
      socketService.unpinMessage(messageId);
      toast.success("Message unpinned");
    } catch (error) {
      console.error("Unpin error:", error);
      toast.error(error.response?.data?.message || "Failed to unpin message");
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    try {
      console.log(
        "Searching for:",
        searchQuery,
        "in channel:",
        activeChannel?._id,
      );
      const response = await messageAPI.search(searchQuery, activeChannel?._id);
      console.log("Search response:", response);
      console.log("Search results messages:", response.data.data.messages);
      console.log("Number of results:", response.data.data.messages.length);
      setSearchResults(response.data.data.messages);

      if (response.data.data.messages.length === 0) {
        toast.info("No messages found");
      } else {
        toast.success(`Found ${response.data.data.messages.length} message(s)`);
      }
    } catch (error) {
      console.error("Search error:", error);
      toast.error(error.response?.data?.message || "Search failed");
    }
  };

  const loadPinnedMessages = async () => {
    if (!activeChannel) return;

    try {
      console.log("Loading pinned messages for channel:", activeChannel._id);
      const response = await messageAPI.getPinned(activeChannel._id);
      console.log("Pinned messages response:", response);
      setPinnedMessages(response.data.data);
      setShowPinned(true);
      toast.success(`Found ${response.data.data.length} pinned messages`);
    } catch (error) {
      console.error("Load pinned error:", error);
      toast.error(
        error.response?.data?.message || "Failed to load pinned messages",
      );
    }
  };

  const handleCreateInviteCode = async () => {
    if (!activeChannel) return;

    try {
      console.log("Creating invite code for channel:", activeChannel._id);
      console.log("Active channel data:", activeChannel);
      console.log("Current user ID:", user.id);
      console.log("Channel admins:", activeChannel.admins);

      const response = await channelAPI.createInviteCode(activeChannel._id);
      console.log("Invite code response:", response);
      setInviteCode(response.data.data.inviteCode);
      setShowInviteModal(true);
      toast.success("Invite code created!");
    } catch (error) {
      console.error("Create invite error:", error);
      console.error("Error response:", error.response?.data);
      toast.error(
        error.response?.data?.message || "Failed to create invite code",
      );
    }
  };

  const handleJoinWithCode = async () => {
    if (!joinCode.trim()) return;

    try {
      console.log("Attempting to join with code:", joinCode);
      console.log("Code length:", joinCode.length);
      console.log("Code trimmed:", joinCode.trim());

      const response = await channelAPI.joinWithCode(
        joinCode.trim().toUpperCase(),
      );
      console.log("Join response:", response);

      setChannels([...channels, response.data.channel]);
      setJoinCode("");
      toast.success(`Joined ${response.data.channel.name} successfully!`);
      loadChannels(); // Reload channels to get updated list
    } catch (error) {
      console.error("Join with code error:", error);
      console.error("Error response:", error.response?.data);
      toast.error(error.response?.data?.message || "Failed to join channel");
    }
  };

  const handleAskAI = async () => {
    if (!aiPrompt.trim()) return;

    setAiLoading(true);
    const userMessage = aiPrompt;
    setAiPrompt("");

    try {
      // Add user message to history
      const newHistory = [...aiHistory, { role: "user", content: userMessage }];
      setAiHistory(newHistory);

      const response = await messageAPI.askAI(userMessage, activeChannel?._id);
      console.log("AI Response:", response.data);

      // The AI response is in response.data.data.content
      const aiMessage = response.data.data?.content || response.data.data || "No response";

      // Add AI response to history
      setAiHistory([...newHistory, { role: "assistant", content: aiMessage }]);
      setAiResponse(aiMessage);
      toast.success("AI responded!");
    } catch (error) {
      console.error("AI error:", error);
      console.error("Error details:", error.response?.data);
      toast.error("Failed to get AI response");
    } finally {
      setAiLoading(false);
    }
  };

  // AI helper: ask AI with a direct prompt (bypasses aiPrompt state)
  const handleAskAIWithPrompt = async (prompt) => {
    if (!prompt.trim()) return;
    setAiLoading(true);
    try {
      const newHistory = [...aiHistory, { role: "user", content: prompt }];
      setAiHistory(newHistory);
      const response = await messageAPI.askAI(prompt, activeChannel?._id);
      const aiMessage = response.data.data?.content || response.data.data || "No response";
      setAiHistory([...newHistory, { role: "assistant", content: aiMessage }]);
    } catch (error) {
      console.error("AI error:", error);
      toast.error("AI failed to respond");
    } finally {
      setAiLoading(false);
    }
  };

  // Tone Rewrite: rewrite messageText in chosen tone
  const handleToneRewrite = async (tone) => {
    if (!messageText.trim()) {
      toast.error("Type a message first to rewrite its tone");
      return;
    }
    setShowToneMenu(false);
    setToneLoading(true);
    try {
      const response = await messageAPI.askAI(
        `Rewrite this message in a ${tone} tone. Respond with ONLY the rewritten message, no explanation: "${messageText}"`,
        activeChannel?._id,
        true,
      );
      setMessageText(response.data.data.content);
    } catch (error) {
      console.error("Tone rewrite error:", error);
      toast.error("Tone rewrite failed");
    } finally {
      setToneLoading(false);
    }
  };

  // Translation: translate a single message into chosen language
  const handleTranslate = async (msgId, content, lang) => {
    setShowTranslateFor(null);
    try {
      const response = await messageAPI.askAI(
        `Translate this message to ${lang}. Respond with ONLY the translated text, nothing else: "${content}"`,
        activeChannel?._id,
        true,
      );
      setPendingTranslations((prev) => ({
        ...prev,
        [msgId]: { text: response.data.data.content, lang },
      }));
    } catch (error) {
      console.error("Translation error:", error);
      toast.error("Translation failed");
    }
  };

  const handleAcceptTranslation = (msgId) => {
    const pending = pendingTranslations[msgId];
    if (!pending) return;
    setAcceptedTranslations((prev) => ({ ...prev, [msgId]: pending }));
    setPendingTranslations((prev) => { const n = { ...prev }; delete n[msgId]; return n; });
  };

  const handleRejectTranslation = (msgId) => {
    setPendingTranslations((prev) => { const n = { ...prev }; delete n[msgId]; return n; });
  };

  const handleRevertTranslation = (msgId) => {
    setAcceptedTranslations((prev) => { const n = { ...prev }; delete n[msgId]; return n; });
  };

  // Summarize conversation via AI chat modal
  const handleSummarizeConversation = async () => {
    if (messages.length === 0) {
      toast.error("No messages to summarize");
      return;
    }
    setShowAIChat(true);
    const recentMessages = messages
      .slice(-20)
      .map((m) => `${m.sender?.name || "User"}: ${m.content}`)
      .join("\n");
    await handleAskAIWithPrompt(
      `Please summarize this conversation in 3-5 bullet points:\n\n${recentMessages}`,
    );
  };

  // Auto-scroll AI chat to bottom when history updates
  useEffect(() => {
    aiHistoryEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [aiHistory, aiLoading]);

  // Debounced inline autocomplete: triggers 800ms after user stops typing
  useEffect(() => {
    if (suggestionJustAccepted.current) {
      suggestionJustAccepted.current = false;
      return;
    }
    if (messageText.length < 3 || !activeChannel) {
      setTypingSuggestion("");
      return;
    }
    const timer = setTimeout(async () => {
      setSuggestionLoading(true);
      try {
        const response = await messageAPI.askAI(
          `Complete this partial chat message that a user is typing. Return ONLY the completed message text (max 15 words, no quotes, no names, no greetings, continue in the same person's voice and intent): "${messageText}"`,
          null,
          true,
        );
        const suggestion = response.data.data.content?.trim().replace(/^"|"$/g, "") || "";
        if (suggestion && suggestion.toLowerCase() !== messageText.toLowerCase()) {
          setTypingSuggestion(suggestion);
        }
      } catch {
        // silently fail
      } finally {
        setSuggestionLoading(false);
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [messageText, activeChannel]);

  const handleLogout = () => {
    socketService.disconnect();
    logout();
    navigate("/login");
  };

  return (
    <div style={{ display: "flex", height: "100vh", background: BG }}>
      {/* Sidebar with Dark Theme */}
      <div
        style={{
          width: "250px",
          background: SIDEBAR_BG,
          color: SIDEBAR_TEXT,
          display: "flex",
          flexDirection: "column",
          border: "none",
          borderRadius: "0",
          boxShadow: "none",
        }}
      >
        <div
          style={{
            padding: "1rem",
            borderBottom: `1px solid ${SIDEBAR_BORDER}`,
          }}
        >
          <h1
            style={{
              fontSize: "1.25rem",
              fontWeight: "bold",
              margin: 0,
              background: "linear-gradient(135deg, #667eea, #764ba2)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            ChatGenius
          </h1>
          <p
            style={{
              fontSize: "0.875rem",
              color: SIDEBAR_SUBTEXT,
              margin: "0.25rem 0 0 0",
            }}
          >
            {user?.name}
          </p>
        </div>

        {/* 🤖 AI Assistant - Always Accessible in Navbar */}
        <div style={{ padding: "0.75rem 1rem", borderBottom: `1px solid ${SIDEBAR_BORDER}` }}>
          <button
            onClick={() => { setShowSearch(false); setShowAIChat(true); }}
            style={{
              width: "100%",
              padding: "0.65rem",
              background: "linear-gradient(135deg, #6366f1, #4f46e5)",
              border: "none",
              borderRadius: "12px",
              color: "#ffffff",
              cursor: "pointer",
              fontWeight: "700",
              fontSize: "0.9rem",
              boxShadow: "0 4px 12px rgba(99,102,241,0.35)",
              transition: "all 0.2s",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
            }}
          >
            🤖 AI Assistant
          </button>
          <p style={{ fontSize: "0.7rem", color: SIDEBAR_SUBTEXT, textAlign: "center", margin: "0.4rem 0 0", lineHeight: "1.3" }}>
            Summarize · Translate · Draft · Ask
          </p>
        </div>

        <div style={{ padding: "1rem" }}>
          <button
            onClick={() => setShowCreateChannel(!showCreateChannel)}
            style={{
              width: "100%",
              padding: "0.6rem",
              background: SIDEBAR_CARD,
              border: `1px solid ${SIDEBAR_BORDER}`,
              borderRadius: "12px",
              color: SIDEBAR_TEXT,
              cursor: "pointer",
              fontWeight: "600",
              boxShadow: darkSoftShadow,
              transition: "all 0.2s",
            }}
          >
            + New Channel
          </button>

          {showCreateChannel && (
            <form
              onSubmit={handleCreateChannel}
              style={{ marginTop: "0.5rem" }}
            >
              <input
                type="text"
                value={newChannelName}
                onChange={(e) => setNewChannelName(e.target.value)}
                placeholder="Channel name"
                style={{
                  width: "100%",
                  padding: "0.5rem",
                  marginBottom: "0.5rem",
                  borderRadius: "10px",
                  border: `1px solid ${SIDEBAR_BORDER}`,
                  background: "#0a0f18",
                  color: SIDEBAR_TEXT,
                  boxShadow: darkInsetShadow,
                  outline: "none",
                }}
              />
              <button
                type="submit"
                style={{
                  width: "100%",
                  padding: "0.5rem",
                  background: SIDEBAR_ACCENT,
                  border: "none",
                  borderRadius: "10px",
                  color: "white",
                  cursor: "pointer",
                  fontWeight: "600",
                  boxShadow: darkSoftShadow,
                }}
              >
                Create
              </button>
            </form>
          )}
        </div>

        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "1rem",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <h3
            style={{
              fontSize: "0.75rem",
              fontWeight: "700",
              marginBottom: "0.8rem",
              color: SIDEBAR_SUBTEXT,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            Channels
          </h3>
          {channels.map((channel) => (
            <div
              key={channel._id}
              onClick={() => setActiveChannel(channel)}
              style={{
                padding: "0.6rem 0.8rem",
                marginBottom: "0.5rem",
                borderRadius: "10px",
                cursor: "pointer",
                background:
                  activeChannel?._id === channel._id
                    ? "linear-gradient(135deg, #1e293b, #0f172a)"
                    : "transparent",
                borderLeft:
                  activeChannel?._id === channel._id
                    ? `4px solid ${SIDEBAR_ACCENT}`
                    : "none",
                border:
                  activeChannel?._id === channel._id
                    ? "1px solid #334155"
                    : "none",
                color:
                  activeChannel?._id === channel._id
                    ? "#e2e8f0"
                    : SIDEBAR_SUBTEXT,
                boxShadow:
                  activeChannel?._id === channel._id ? darkInsetShadow : "none",
                transition: "all 0.2s",
                fontWeight: activeChannel?._id === channel._id ? "600" : "500",
              }}
            >
              # {channel.name}
            </div>
          ))}
        </div>

        <div
          style={{
            padding: "0 0 1rem 0",
            // position: 'sticky',
            // bottom: 0,
            background: SIDEBAR_BG,
          }}
        >
          {/* JOIN BOX */}
          {/* JOIN BOX */}
          <div
            style={{
              margin: "0 1rem 1rem 1rem",
              padding: "1rem",
              borderRadius: "14px",
              background: SIDEBAR_CARD,
              border: `1px solid ${SIDEBAR_BORDER}`,
            }}
          >
            <h4
              style={{
                fontSize: "0.85rem",
                fontWeight: "600",
                marginBottom: "0.7rem",
                color: SIDEBAR_TEXT,
              }}
            >
              Join with Code
            </h4>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                width: "100%", // ✅ prevents overflow
              }}
            >
              <input
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                placeholder="Enter code"
                style={{
                  flex: 1,
                  minWidth: 0, // ✅ VERY IMPORTANT (fix overflow)
                  height: "34px",
                  padding: "0 10px",
                  borderRadius: "8px",
                  border: `1px solid ${SIDEBAR_BORDER}`,
                  background: "#0a0f18",
                  color: SIDEBAR_TEXT,
                  outline: "none",
                }}
              />

              <button
                onClick={handleJoinWithCode}
                style={{
                  height: "34px",
                  padding: "0 12px",
                  background: "linear-gradient(135deg, #2f855a, #276749)",
                  color: "#fff",
                  border: "none",
                  borderRadius: "8px",
                  fontWeight: "600",
                  fontSize: "0.85rem",
                  cursor: "pointer",
                  whiteSpace: "nowrap", // ✅ prevents stretch
                }}
              >
                Join
              </button>
            </div>
          </div>

          {/* LOGOUT */}
          <div style={{ padding: "0 1rem" }}>
            <button
              onClick={handleLogout}
              style={{
                width: "100%",
                padding: "0.6rem",
                background: "#dc2626",
                color: "#fff",
                border: "none",
                borderRadius: "10px",
                fontWeight: "600",
                cursor: "pointer",
              }}
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main Chat Area with Neomorphism */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          background: "linear-gradient(to bottom, #f8fafc, #eef2f7)",
        }}
      >
        {activeChannel ? (
          <>
            <div
              style={{
                padding: "1rem 1.5rem",
                background: CARD,
                boxShadow: "none",
                borderBottom: "1px solid #e5e7eb",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <h2
                    style={{
                      fontSize: "1.25rem",
                      fontWeight: "bold",
                      margin: 0,
                      color: "#2d3748",
                    }}
                  >
                    <span style={{ color: "#0891b2" }}>#</span>
                    {activeChannel.name}
                  </h2>
                  <p
                    style={{
                      fontSize: "0.875rem",
                      color: "#718096",
                      margin: "0.25rem 0 0 0",
                    }}
                  >
                    {activeChannel.description || "No description"}
                  </p>
                </div>
                <div style={{ display: "flex", gap: "0.6rem" }}>
                  <button
                    onClick={() => {
                      setShowSearch(false);
                      setShowAIChat(true);
                    }}
                    style={{
                      padding: "0.5rem 1rem",
                      background: "linear-gradient(135deg, #2f855a, #22543d)",
                      color: "#ffffff",
                      border: "none",
                      borderRadius: "10px",
                      cursor: "pointer",
                      fontSize: "0.875rem",
                      fontWeight: "600",
                      boxShadow: "none",
                    }}
                  >
                    🤖 AI
                  </button>
                  <button
                    onClick={handleSummarizeConversation}
                    disabled={aiLoading}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#e0e7ff")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "#ffffff")}
                    style={{
                      padding: "0.5rem 1rem",
                      background: "#ffffff",
                      border: "1px solid #c7d2fe",
                      borderRadius: "10px",
                      cursor: aiLoading ? "not-allowed" : "pointer",
                      fontSize: "0.875rem",
                      fontWeight: "600",
                      boxShadow: "none",
                      color: "#4338ca",
                    }}
                  >
                    📝 Summarize
                  </button>
                  <button
                    onClick={() => {
                      setShowSearch(false); // ✅ close search
                      loadPinnedMessages(); // open pinned
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = "#f3f4f6")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "#ffffff")
                    }
                    style={{
                      padding: "0.5rem 1rem",
                      background: "#ffffff",
                      border: "1px solid #e5e7eb",
                      borderRadius: "10px",
                      cursor: "pointer",
                      fontSize: "0.875rem",
                      fontWeight: "600",
                      boxShadow: "none",
                    }}
                  >
                    📌 Pinned
                  </button>
                  <button
                    onClick={() => setShowSearch(!showSearch)}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = "#f3f4f6")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "#ffffff")
                    }
                    style={{
                      padding: "0.5rem 1rem",
                      background: "#ffffff",
                      border: "1px solid #e5e7eb",
                      borderRadius: "10px",
                      cursor: "pointer",
                      fontSize: "0.875rem",
                      fontWeight: "600",
                      boxShadow: "none",
                    }}
                  >
                    🔍 Search
                  </button>
                  <button
                    onClick={() => {
                      setShowSearch(false);
                      handleCreateInviteCode();
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = "#f3f4f6")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "#ffffff")
                    }
                    style={{
                      padding: "0.5rem 1rem",
                      background: "#ffffff",
                      border: "1px solid #e5e7eb",
                      borderRadius: "10px",
                      cursor: "pointer",
                      fontSize: "0.875rem",
                      fontWeight: "600",
                      boxShadow: "none",
                    }}
                  >
                    🔗 Invite
                  </button>
                </div>
              </div>

              {showSearch && (
                <div
                  style={{ marginTop: "1rem", display: "flex", gap: "0.6rem" }}
                >
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search messages..."
                    style={{
                      flex: 1,
                      padding: "0.6rem",
                      borderRadius: "10px",
                      border: `1px solid ${BORDER}`,
                      background: BG,
                      color: TEXT,
                      boxShadow: insetShadow,
                      outline: "none",
                    }}
                  />
                  <button
                    onClick={handleSearch}
                    style={{
                      padding: "0.6rem 1.2rem",
                      background: "linear-gradient(135deg, #2f855a, #276749)",
                      color: "#ffffff",
                      fontWeight: "600",
                      borderRadius: "10px",
                      border: "none",
                      borderRadius: "10px",
                      cursor: "pointer",
                      fontWeight: "600",
                      boxShadow: "none",
                    }}
                  >
                    Search
                  </button>
                </div>
              )}
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: "1rem 1.5rem" }}>
              {messages.map((message) => (
                <div
                  key={message._id}
                  style={{
                    marginBottom: "12px",
                    padding: "12px 14px",
                    background: "#ffffff",
                    border: "1px solid #e5e7eb",
                    borderRadius: "14px",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.04)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "0.5rem",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                      }}
                    >
                      <span style={{ fontWeight: "700", color: "#2d3748" }}>
                        {message.sender.name}
                      </span>
                      <span style={{ fontSize: "0.75rem", color: "#718096" }}>
                        {new Date(message.createdAt).toLocaleTimeString()}
                      </span>
                      {message.isEdited && (
                        <span style={{ fontSize: "0.75rem", color: "#718096" }}>
                          (edited)
                        </span>
                      )}
                      {message.isPinned && (
                        <span style={{ fontSize: "0.75rem" }}>📌</span>
                      )}
                    </div>
                    <div style={{ display: "flex", gap: "0.4rem" }}>
                      {message.sender._id === user.id && (
                        <button
                          onClick={() => {
                            setEditingMessageId(message._id);
                            setEditText(message.content);
                          }}
                          style={{
                            padding: "0.25rem 0.6rem",
                            background: CARD,
                            color: TEXT,
                            border: `1px solid ${BORDER}`,
                            borderRadius: "6px",
                            cursor: "pointer",
                            fontSize: "0.75rem",
                            fontWeight: "600",
                            boxShadow: "none",
                          }}
                        >
                          ✏️
                        </button>
                      )}
                      {activeChannel &&
                        (activeChannel.admins?.some(
                          (admin) => admin._id === user.id,
                        ) ||
                          activeChannel.moderators?.some(
                            (mod) => mod._id === user.id,
                          )) && (
                          <button
                            onClick={() =>
                              message.isPinned
                                ? handleUnpinMessage(message._id)
                                : handlePinMessage(message._id)
                            }
                            style={{
                              padding: "0.25rem 0.6rem",
                              background: CARD,
                              color: TEXT,
                              border: `1px solid ${BORDER}`,
                              borderRadius: "6px",
                              cursor: "pointer",
                              fontSize: "0.75rem",
                              fontWeight: "600",
                              boxShadow: "none",
                            }}
                          >
                            {message.isPinned ? "Unpin" : "📌"}
                          </button>
                        )}
                    </div>
                  </div>

                  {editingMessageId === message._id ? (
                    <div
                      style={{
                        display: "flex",
                        gap: "0.5rem",
                        marginTop: "0.5rem",
                      }}
                    >
                      <input
                        type="text"
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        style={{
                          flex: 1,
                          padding: "0.5rem",
                          borderRadius: "8px",
                          border: `1px solid ${BORDER}`,
                          background: CARD,
                          color: "#2d3748",
                          boxShadow: "none",
                          outline: "none",
                        }}
                      />
                      <button
                        onClick={() => handleEditMessage(message._id)}
                        style={{
                          padding: "0.5rem 0.8rem",
                          background: "#2f855a",
                          color: "white",
                          border: "none",
                          borderRadius: "8px",
                          cursor: "pointer",
                          fontWeight: "600",
                          boxShadow: "none",
                        }}
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingMessageId(null)}
                        style={{
                          padding: "0.5rem 0.8rem",
                          background: CARD,
                          color: "#2d3748",
                          border: `1px solid ${BORDER}`,
                          borderRadius: "8px",
                          cursor: "pointer",
                          fontWeight: "600",
                          boxShadow: "none",
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div>
                      {/* Message content: show accepted translation or original */}
                      <div style={{ color: "#2d3748", lineHeight: "1.5" }}>
                        {acceptedTranslations[message._id]
                          ? acceptedTranslations[message._id].text
                          : message.content}
                      </div>
                      {/* Accepted translation badge */}
                      {acceptedTranslations[message._id] && (
                        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginTop: "0.25rem" }}>
                          <span style={{ fontSize: "0.72rem", color: "#0369a1", background: "#e0f2fe", padding: "1px 6px", borderRadius: "10px", border: "1px solid #7dd3fc" }}>
                            🌐 {acceptedTranslations[message._id].lang}
                          </span>
                          <button
                            onClick={() => handleRevertTranslation(message._id)}
                            style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", fontSize: "0.7rem" }}
                          >Revert</button>
                        </div>
                      )}
                      {/* Pending translation: Accept / Reject */}
                      {pendingTranslations[message._id] && (
                        <div style={{
                          marginTop: "0.4rem",
                          padding: "0.5rem 0.7rem",
                          background: "#fffbeb",
                          border: "1px solid #fcd34d",
                          borderRadius: "8px",
                          fontSize: "0.82rem",
                          color: "#78350f",
                        }}>
                          <div style={{ fontStyle: "italic", marginBottom: "0.4rem" }}>
                            [{pendingTranslations[message._id].lang}] {pendingTranslations[message._id].text}
                          </div>
                          <div style={{ display: "flex", gap: "0.4rem" }}>
                            <button
                              onClick={() => handleAcceptTranslation(message._id)}
                              style={{ padding: "0.2rem 0.7rem", background: "#16a34a", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "0.75rem", fontWeight: "600" }}
                            >✓ Accept</button>
                            <button
                              onClick={() => handleRejectTranslation(message._id)}
                              style={{ padding: "0.2rem 0.7rem", background: "#dc2626", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "0.75rem", fontWeight: "600" }}
                            >✕ Reject</button>
                          </div>
                        </div>
                      )}
                      {/* AI action buttons per message */}
                      <div style={{ display: "flex", gap: "0.3rem", marginTop: "0.4rem", flexWrap: "wrap" }}>
                        {/* Translate dropdown */}
                        <div style={{ position: "relative" }}>
                          <button
                            onClick={() => setShowTranslateFor(showTranslateFor === message._id ? null : message._id)}
                            title="Translate this message"
                            style={{
                              padding: "0.2rem 0.5rem",
                              background: "#e0f2fe",
                              border: "1px solid #7dd3fc",
                              borderRadius: "6px",
                              cursor: "pointer",
                              fontSize: "0.7rem",
                              color: "#0369a1",
                              fontWeight: "600",
                            }}
                          >
                            🌐 Translate
                          </button>
                          {showTranslateFor === message._id && (
                            <div style={{
                              position: "absolute",
                              top: "100%",
                              left: 0,
                              zIndex: 200,
                              background: CARD,
                              border: `1px solid ${BORDER}`,
                              borderRadius: "10px",
                              boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
                              overflow: "hidden",
                              minWidth: "130px",
                              marginTop: "2px",
                            }}>
                              {["English", "Hindi", "Spanish", "French", "German", "Chinese", "Arabic", "Japanese"].map((lang) => (
                                <button
                                  key={lang}
                                  onClick={() => handleTranslate(message._id, message.content, lang)}
                                  style={{
                                    display: "block",
                                    width: "100%",
                                    padding: "0.4rem 0.8rem",
                                    background: "none",
                                    border: "none",
                                    borderBottom: `1px solid ${BORDER}`,
                                    cursor: "pointer",
                                    textAlign: "left",
                                    fontSize: "0.82rem",
                                    color: TEXT,
                                  }}
                                >
                                  {lang}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div
              style={{
                padding: "0.6rem 1.5rem 1rem",
                background: CARD,
                boxShadow: "none",
                borderTop: `1px solid ${BORDER}`,
              }}
            >
              {/* AI Toolbar: Tone Rewrite */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                <span style={{ fontSize: "0.72rem", color: SUBTEXT, fontWeight: "600" }}>AI Tools:</span>
                <div style={{ position: "relative" }}>
                  <button
                    onClick={() => setShowToneMenu(!showToneMenu)}
                    disabled={toneLoading}
                    style={{
                      padding: "0.25rem 0.7rem",
                      background: showToneMenu ? "#fef3c7" : "#f9fafb",
                      border: `1px solid ${showToneMenu ? "#fbbf24" : BORDER}`,
                      borderRadius: "20px",
                      cursor: toneLoading ? "not-allowed" : "pointer",
                      fontSize: "0.75rem",
                      color: "#92400e",
                      fontWeight: "600",
                    }}
                  >
                    {toneLoading ? "Rewriting..." : "✨ Rewrite Tone ▾"}
                  </button>
                  {showToneMenu && (
                    <div style={{
                      position: "absolute",
                      bottom: "110%",
                      left: 0,
                      zIndex: 300,
                      background: CARD,
                      border: `1px solid ${BORDER}`,
                      borderRadius: "12px",
                      boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
                      overflow: "hidden",
                      minWidth: "150px",
                    }}>
                      {[
                        { label: "🎩 Formal", tone: "formal" },
                        { label: "😊 Friendly", tone: "friendly" },
                        { label: "✂️ Concise", tone: "concise" },
                        { label: "💼 Professional", tone: "professional" },
                      ].map(({ label, tone }) => (
                        <button
                          key={tone}
                          onClick={() => handleToneRewrite(tone)}
                          style={{
                            display: "block",
                            width: "100%",
                            padding: "0.5rem 0.9rem",
                            background: "none",
                            border: "none",
                            borderBottom: `1px solid ${BORDER}`,
                            cursor: "pointer",
                            textAlign: "left",
                            fontSize: "0.85rem",
                            color: TEXT,
                            fontWeight: "500",
                          }}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <span style={{ fontSize: "0.7rem", color: "#9ca3af" }}>
                  Tip: type <code style={{ background: "#f3f4f6", padding: "1px 4px", borderRadius: "3px" }}>@ai your question</code> to ask AI inline
                </span>
              </div>

              {/* Inline autocomplete suggestion bar */}
              {(typingSuggestion || suggestionLoading) && (
                <div style={{
                  marginBottom: "0.5rem",
                  background: "#f8faff",
                  border: "1px solid #c7d2fe",
                  borderRadius: "10px",
                  padding: "0.4rem 0.8rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  boxShadow: "0 2px 8px rgba(99,102,241,0.1)",
                }}>
                  <span style={{ fontSize: "0.82rem", color: suggestionLoading ? "#9ca3af" : "#4338ca", fontStyle: suggestionLoading ? "italic" : "normal" }}>
                    💡 {suggestionLoading ? "Thinking..." : typingSuggestion}
                  </span>
                  {typingSuggestion && !suggestionLoading && (
                    <div style={{ display: "flex", gap: "0.4rem", alignItems: "center", flexShrink: 0 }}>
                      <kbd
                        style={{ background: "#e0e7ff", border: "1px solid #c7d2fe", borderRadius: "4px", padding: "1px 6px", fontSize: "0.7rem", color: "#4338ca", cursor: "pointer" }}
                        onClick={() => { suggestionJustAccepted.current = true; setMessageText(typingSuggestion); setTypingSuggestion(""); }}
                      >Tab</kbd>
                      <button onClick={() => setTypingSuggestion("")} style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", fontSize: "0.7rem", padding: 0 }}>✕</button>
                    </div>
                  )}
                </div>
              )}

              <form
                onSubmit={handleSendMessage}
                style={{ display: "flex", gap: "0.6rem" }}
              >
                <input
                    type="text"
                    value={messageText}
                    onChange={(e) => { setMessageText(e.target.value); setTypingSuggestion(""); }}
                    onKeyDown={(e) => {
                      if (e.key === "Tab" && typingSuggestion) {
                        e.preventDefault();
                        suggestionJustAccepted.current = true;
                        setMessageText(typingSuggestion);
                        setTypingSuggestion("");
                      }
                      if (e.key === "Escape") setTypingSuggestion("");
                    }}
                    placeholder={`Message #${activeChannel.name}`}
                    onFocus={(e) => (e.target.style.border = "1px solid #2f855a")}
                    onBlur={(e) => (e.target.style.border = "1px solid #d1d5db")}
                    style={{
                      flex: 1,
                      padding: "12px",
                      borderRadius: "14px",
                      border: "1px solid #d1d5db",
                      background: "#ffffff",
                      color: TEXT,
                      boxShadow: "none",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                <button
                  type="submit"
                  disabled={loading || !messageText.trim()}
                  style={{
                    padding: "0.7rem 1.5rem",
                    background: "linear-gradient(135deg, #2f855a, #276749)",
                    color: "#ffffff",
                    fontWeight: "600",
                    fontSize: "0.9rem",
                    letterSpacing: "0.3px",

                    border: "none",
                    borderRadius: "12px",
                    cursor:
                      loading || !messageText.trim()
                        ? "not-allowed"
                        : "pointer",
                    fontWeight: "600",
                    boxShadow: "none",
                    opacity: loading || !messageText.trim() ? 1 : 1,
                  }}
                >
                  Send
                </button>
              </form>
            </div>
          </>
        ) : (
          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#718096",
            }}
          >
            <div style={{ textAlign: "center" }}>
              <h2
                style={{
                  fontSize: "1.5rem",
                  marginBottom: "0.5rem",
                  color: "#2d3748",
                }}
              >
                Welcome to ChatGenius!
              </h2>
              <p>Select a channel to start chatting</p>
            </div>
          </div>
        )}
      </div>

      {/* Pinned Messages Modal - Neomorphism */}
      {showPinned && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              background: CARD,
              padding: "2rem",
              borderRadius: "20px",
              maxWidth: "600px",
              width: "90%",
              maxHeight: "80vh",
              overflowY: "auto",
              border: `1px solid ${BORDER}`,
              boxShadow: "none",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "1rem",
              }}
            >
              <h3
                style={{
                  fontSize: "1.25rem",
                  fontWeight: "bold",
                  color: "#2d3748",
                }}
              >
                📌 Pinned Messages
              </h3>
              <button
                onClick={() => setShowPinned(false)}
                style={{
                  padding: "0.5rem 1rem",
                  background: CARD,
                  color: "#c53030",
                  border: `1px solid ${BORDER}`,
                  borderRadius: "10px",
                  cursor: "pointer",
                  fontWeight: "600",
                  boxShadow: "none",
                }}
              >
                Close
              </button>
            </div>
            {pinnedMessages.length > 0 ? (
              pinnedMessages.map((msg) => (
                <div
                  key={msg._id}
                  style={{
                    padding: "1rem",
                    background: "#f9fafb",
                    border: `1px solid ${BORDER}`,
                    borderRadius: "14px",
                    marginBottom: "0.8rem",
                    boxShadow: "none",
                  }}
                >
                  <div
                    style={{
                      fontWeight: "700",
                      marginBottom: "0.25rem",
                      color: "#2d3748",
                    }}
                  >
                    {msg.sender.name}
                  </div>
                  <div style={{ color: "#2d3748", lineHeight: "1.5" }}>
                    {msg.content}
                  </div>
                  <div
                    style={{
                      fontSize: "0.75rem",
                      color: "#718096",
                      marginTop: "0.25rem",
                    }}
                  >
                    {new Date(msg.createdAt).toLocaleString()}
                  </div>
                </div>
              ))
            ) : (
              <p style={{ color: "#718096", textAlign: "center" }}>
                No pinned messages
              </p>
            )}
          </div>
        </div>
      )}

      {/* Search Results Modal - Neomorphism */}
      {searchResults.length > 0 && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              background: CARD,
              padding: "2rem",
              borderRadius: "20px",
              maxWidth: "600px",
              border: `1px solid ${BORDER}`,
              boxShadow: "none",
              width: "90%",
              maxHeight: "80vh",
              overflowY: "auto",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "1rem",
              }}
            >
              <h3
                style={{ fontSize: "1.25rem", fontWeight: "bold", color: TEXT }}
              >
                🔍 Search Results ({searchResults.length})
              </h3>
              <button
                onClick={() => {
                  setSearchResults([]);
                  setShowSearch(false); // ✅ hide search bar
                  setSearchQuery(""); // ✅ reset input
                }}
                style={{
                  padding: "0.5rem 1rem",
                  background: CARD,
                  color: "#c53030",
                  border: `1px solid ${BORDER}`,
                  borderRadius: "10px",
                  cursor: "pointer",
                  fontWeight: "600",
                  boxShadow: "none",
                }}
              >
                Close
              </button>
            </div>
            {searchResults.map((msg) => (
              <div
                key={msg._id}
                style={{
                  padding: "1rem",
                  background: "#f9fafb",
                  border: `1px solid ${BORDER}`,
                  borderRadius: "14px",
                  marginBottom: "0.8rem",
                  boxShadow: "none",
                }}
              >
                <div
                  style={{
                    fontWeight: "700",
                    marginBottom: "0.25rem",
                    color: TEXT,
                  }}
                >
                  {msg.sender.name}
                </div>
                <div style={{ color: TEXT, lineHeight: "1.5" }}>
                  {msg.content}
                </div>
                <div
                  style={{
                    fontSize: "0.75rem",
                    color: SUBTEXT,
                    marginTop: "0.25rem",
                  }}
                >
                  {new Date(msg.createdAt).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Invite Code Modal */}
      {showInviteModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              background: CARD,
              padding: "2rem",
              borderRadius: "20px",
              maxWidth: "400px",
              width: "90%",
              border: `1px solid ${BORDER}`,
              boxShadow: "none",
            }}
          >
            <h3
              style={{
                fontSize: "1.25rem",
                fontWeight: "bold",
                marginBottom: "1rem",
                color: TEXT,
              }}
            >
              🔗 Channel Invite Code
            </h3>
            <p style={{ marginBottom: "1rem", color: SUBTEXT }}>
              Share this code with others to invite them to this channel:
            </p>
            <div
              style={{
                padding: "1rem",
                background: "#f9fafb",
                border: `1px solid ${BORDER}`,
                borderRadius: "14px",
                marginBottom: "1rem",
                textAlign: "center",
                fontSize: "1.5rem",
                fontWeight: "bold",
                letterSpacing: "0.1em",
                color: TEXT,
                boxShadow: "none",
              }}
            >
              {inviteCode}
            </div>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(inviteCode);
                  toast.success("Invite code copied!");
                }}
                style={{
                  flex: 1,
                  padding: "0.75rem",
                  background: "linear-gradient(135deg, #2f855a, #276749)",
                  color: "white",
                  border: "none",
                  borderRadius: "10px",
                  fontWeight: "600",
                  boxShadow: "none",
                  cursor: "pointer",
                }}
              >
                Copy Code
              </button>
              <button
                onClick={() => setShowInviteModal(false)}
                style={{
                  flex: 1,
                  padding: "0.75rem",
                  background: CARD,
                  color: TEXT,
                  border: `1px solid ${BORDER}`,
                  borderRadius: "10px",
                  fontWeight: "600",
                  boxShadow: "none",
                  cursor: "pointer",
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Chat Modal - Neomorphism */}
      {showAIChat && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              background: CARD,
              padding: "2rem",
              borderRadius: "20px",
              maxWidth: "700px",
              width: "90%",

              display: "flex",
              flexDirection: "column",
              height: "80vh", // ✅ FIXED HEIGHT
              maxHeight: "80vh",
              overflow: "hidden", // ✅ prevents overflow issues
              border: `1px solid ${BORDER}`,
              boxShadow: "none",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "1rem",
                paddingBottom: "1rem",
                borderBottom: `1px solid ${BORDER}`,
              }}
            >
              <h3
                style={{ fontSize: "1.5rem", fontWeight: "bold", color: TEXT }}
              >
                🤖 AI Assistant
              </h3>
              <button
                onClick={() => {
                  setShowAIChat(false);
                  setAiHistory([]);
                }}
                style={{
                  padding: "0.5rem 1rem",
                  background: CARD,
                  color: "#c53030",
                  border: `1px solid ${BORDER}`,
                  borderRadius: "10px",
                  cursor: "pointer",
                  fontWeight: "600",
                  boxShadow: "none",
                }}
              >
                Close
              </button>
            </div>

            {/* AI Conversation History */}
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                marginBottom: "1rem",
                padding: "1rem",
                background: "#f9fafb",
                border: `1px solid ${BORDER}`,
                borderRadius: "14px",
                minHeight: 0,
                boxShadow: "none",
              }}
            >
              {aiHistory.length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    color: SUBTEXT,
                    padding: "2rem",
                  }}
                >
                  <p style={{ fontSize: "1.125rem", marginBottom: "0.5rem" }}>
                    👋 Hello! I'm your AI assistant.
                  </p>
                  <p style={{ fontSize: "0.875rem" }}>
                    Ask me anything about this conversation, or request help
                    with:
                  </p>
                  <ul
                    style={{ listStyle: "none", padding: 0, marginTop: "1rem" }}
                  >
                    <li>📝 Summarizing conversations</li>
                    <li>💡 Generating ideas</li>
                    <li>🔍 Analyzing messages</li>
                    <li>✍️ Drafting responses</li>
                  </ul>
                </div>
              ) : (
                aiHistory.map((msg, idx) => (
                  <div
                    key={idx}
                    style={{
                      marginBottom: "1rem",
                      padding: "1rem",
                      background:
                        msg.role === "user"
                          ? "#ffffff" // keep user nice purple
                          : "#ffffff", // soft green (matches your theme)
                      border: `1px solid ${BORDER}`,
                      borderRadius: "12px",
                      boxShadow: "none",
                    }}
                  >
                    <div
                      style={{
                        fontWeight: "600",
                        marginBottom: "0.5rem",
                        color: msg.role === "user" ? "green" : TEXT,
                      }}
                    >
                      {msg.role === "user" ? "👤 You" : "🤖 AI Assistant"}
                    </div>
                    <div
                      style={{
                        color: msg.role === "user" ? "black" : TEXT,
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))
              )}
              <div ref={aiHistoryEndRef} />
              {aiLoading && (
                <div
                  style={{
                    padding: "1rem",
                    background: "#e0e7ff",
                    border: `1px solid ${BORDER}`,
                    borderRadius: "12px",
                    boxShadow: "none",
                  }}
                >
                  <div
                    style={{
                      fontWeight: "600",
                      marginBottom: "0.5rem",
                      color: TEXT,
                    }}
                  >
                    🤖 AI Assistant
                  </div>
                  <div style={{ color: SUBTEXT }}>Thinking... 💭</div>
                </div>
              )}
            </div>

            {/* AI Input */}
            {/* AI Input Section */}
            {/* AI Input */}
            <div
              style={{
                paddingTop: "0.8rem",
                borderTop: `1px solid ${BORDER}`,
                marginTop: "0.5rem",
                paddingBottom: "0.5rem",
              }}
            >
              <div
                style={{
                  display: "flex",
                  gap: "0.6rem",
                  alignItems: "center",
                }}
              >
                <input
                  type="text"
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleAskAI()}
                  placeholder="Ask me anything..."
                  disabled={aiLoading}
                  style={{
                    flex: 1,
                    padding: "0.75rem",
                    border: "1px solid #d1d5db",
                    borderRadius: "12px",
                    background: "#ffffff",
                    fontSize: "0.95rem",
                    outline: "none",
                  }}
                />

                <button
                  onClick={handleAskAI}
                  disabled={aiLoading || !aiPrompt.trim()}
                  style={{
                    padding: "0.7rem 1.4rem",
                    background: "linear-gradient(135deg, #2f855a, #276749)",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "12px",
                    fontWeight: "600",
                    cursor:
                      aiLoading || !aiPrompt.trim() ? "not-allowed" : "pointer",
                    whiteSpace: "nowrap",
                    opacity: aiLoading || !aiPrompt.trim() ? 1 : 1,
                  }}
                >
                  {aiLoading ? "Thinking..." : "Send"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Chat;
