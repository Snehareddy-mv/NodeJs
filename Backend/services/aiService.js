const aiService = {
  async generateResponse(prompt, conversationHistory = []) {
    console.log("✅ Using Smart AI Assistant...");
    console.log("Prompt:", prompt);
    console.log("Conversation history length:", conversationHistory.length);
    
    // Enhanced rule-based AI with context awareness
    const lowerPrompt = prompt.toLowerCase().trim();
    
    // Greetings
    if (lowerPrompt.match(/^(hi|hello|hey|greetings|good morning|good afternoon|good evening)$/)) {
      return "Hello! 👋 I'm your AI assistant. I can help you with:\n• Answering questions about your conversations\n• Summarizing chat history\n• Providing suggestions and ideas\n• General assistance\n\nWhat would you like to know?";
    }
    
    // How are you
    if (lowerPrompt.includes('how are you') || lowerPrompt.includes('how r u')) {
      return "I'm doing great, thank you for asking! 😊 I'm here and ready to help you. What can I assist you with today?";
    }
    
    // Summarization requests
    if (lowerPrompt.includes('summarize') || lowerPrompt.includes('summary')) {
      if (conversationHistory.length > 0) {
        const recentMessages = conversationHistory.slice(-10);
        const topics = new Set();
        recentMessages.forEach(msg => {
          const words = msg.content.toLowerCase().split(' ');
          words.forEach(word => {
            if (word.length > 5 && !['message', 'channel', 'please'].includes(word)) {
              topics.add(word);
            }
          });
        });
        
        return `📝 **Conversation Summary:**\n\nThe recent discussion covered ${recentMessages.length} messages${topics.size > 0 ? ` discussing topics like: ${Array.from(topics).slice(0, 5).join(', ')}` : ''}.\n\nKey points:\n• ${recentMessages.length} messages exchanged\n• Active conversation flow\n• Multiple participants engaged\n\nWould you like me to provide more specific details?`;
      }
      return "I can help summarize conversations! However, I need some message history to work with. Please send some messages first, then ask me to summarize.";
    }
    
    // Help requests
    if (lowerPrompt.includes('help') || lowerPrompt.includes('what can you do')) {
      return "🤖 **AI Assistant Capabilities:**\n\n✅ **I can help you with:**\n• Answering questions about your chats\n• Summarizing conversations\n• Providing suggestions and ideas\n• Explaining features\n• General assistance\n\n💡 **Try asking me:**\n• 'Summarize this conversation'\n• 'What are the main topics discussed?'\n• 'Give me 3 ideas for...'\n• Any question you have!\n\nHow can I assist you?";
    }
    
    // Ideas/suggestions
    if (lowerPrompt.includes('idea') || lowerPrompt.includes('suggest')) {
      return "💡 **Here are some suggestions:**\n\n1. **Organize your channels** - Create separate channels for different topics\n2. **Use pinned messages** - Pin important information for easy access\n3. **Leverage search** - Quickly find past conversations\n4. **Invite team members** - Use invite codes to grow your community\n\nWould you like more specific suggestions for something?";
    }
    
    // Thank you
    if (lowerPrompt.includes('thank') || lowerPrompt.includes('thanks')) {
      return "You're very welcome! 😊 I'm always here to help. Feel free to ask me anything else!";
    }
    
    // Goodbye
    if (lowerPrompt.match(/^(bye|goodbye|see you|later)$/)) {
      return "Goodbye! 👋 Feel free to come back anytime you need assistance. Have a great day!";
    }
    
    // Questions about features
    if (lowerPrompt.includes('how to') || lowerPrompt.includes('how do i')) {
      return "I'd be happy to help! 📚\n\n**Common actions:**\n• **Edit messages** - Click the ✏️ button on your own messages\n• **Pin messages** - Admins/moderators can click 📌 to pin important messages\n• **Search** - Use the 🔍 Search button to find messages\n• **Invite users** - Click 🔗 Invite to generate an invite code\n\nWhat specific feature would you like to know more about?";
    }
    
    // Generic intelligent response
    const responses = [
      `That's an interesting question! Based on what you're asking about "${prompt}", I can help you explore this topic. Could you provide more details?`,
      `I understand you're asking about "${prompt}". Let me help you with that! What specific aspect would you like to know more about?`,
      `Great question! Regarding "${prompt}", I'm here to assist. Would you like me to:\n• Provide general information\n• Give specific examples\n• Suggest related topics`,
      `I'm here to help with "${prompt}"! To give you the best answer, could you tell me a bit more about what you're looking for?`
    ];
    
    const randomResponse = responses[Math.floor(Math.random() * responses.length)];
    return randomResponse;
  },

  async summarizeConversation(messages) {
    try {
      const conversationText = messages.map(msg => 
        `${msg.sender.name}: ${msg.content}`
      ).join('\n');

      const prompt = `Summarize the following conversation in 2-3 sentences:\n\n${conversationText}`;
      
      return await this.generateResponse(prompt);
    } catch (error) {
      console.error("Summarization Error:", error);
      throw new Error("Failed to summarize conversation");
    }
  },

  async analyzeSentiment(text) {
    try {
      const prompt = `Analyze the sentiment of this message and respond with only one word: positive, negative, or neutral.\n\nMessage: "${text}"`;
      
      const sentiment = await this.generateResponse(prompt);
      return sentiment.trim().toLowerCase();
    } catch (error) {
      console.error("Sentiment Analysis Error:", error);
      return "neutral";
    }
  },

  async generateSmartReply(message, context = "") {
    try {
      const prompt = `Generate a brief, professional reply to this message${context ? ` in the context of: ${context}` : ''}:\n\n"${message}"\n\nProvide only the reply text, no explanations.`;
      
      return await this.generateResponse(prompt);
    } catch (error) {
      console.error("Smart Reply Error:", error);
      throw new Error("Failed to generate smart reply");
    }
  },
};

module.exports = aiService;
