const aiService = {
  async generateResponse(prompt, conversationHistory = []) {
    console.log("✅ Using OpenRouter LLM (LLaMA-3)...");
    console.log("Prompt:", prompt);

    try {
      const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

      if (!OPENROUTER_API_KEY) {
        throw new Error("❌ Missing OpenRouter API Key");
      }

      // 🧠 STEP 1: Sort history (important for memory)
      if (conversationHistory.length > 0) {
        conversationHistory.sort(
          (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
        );
      }

      // 🧠 STEP 2: System message
      const messages = [
        {
          role: "system",
          content: `You are ChatGenius - an intelligent AI assistant for the ChatGenius messaging platform.

Your primary purpose is to help users understand and use ChatGenius effectively. You should:

✅ ANSWER QUESTIONS ABOUT:
- How to create and manage channels
- How to send, edit, and pin messages
- How to use the search feature
- How to invite users with invite codes
- How to use the AI assistant (summarize conversations, get help)
- Features like pinned messages, message editing, user roles
- Channel settings and moderation
- How to use the invite code system

❌ DO NOT ANSWER:
- General knowledge questions (math, science, history, etc.)
- Questions about other applications or services
- Off-topic conversations
- Questions unrelated to ChatGenius

When users ask off-topic questions, politely redirect them:
"I'm specifically designed to help you with ChatGenius. Could you ask me something about how to use the app? For example: 'How do I pin a message?' or 'How do I invite someone to a channel?'"

Be friendly, conversational, and clear in your responses. Use simple terminology.`,
        },
      ];

      // 🧠 STEP 3: Clean + limit history
      const history = conversationHistory;

      const cleanedHistory = history.filter(
        (msg) =>
          msg.content &&
          msg.content.trim() !== "" &&
          msg.content !== prompt
      );

      cleanedHistory.forEach((msg) => {
        messages.push({
         role: msg.isAIMessage === true ? "assistant" : "user",
          content: msg.content
            .replace(/^admin\d+:\s*/, "")
            .replace(/^user\d+:\s*/, "")
            .trim(),
        });
      });

      // 🧠 STEP 4: Add current user message
      messages.push({
        role: "user",
        content: prompt,
      });

      // 🔍 DEBUG
      console.log("📨 Messages sent to LLM:", JSON.stringify(messages, null, 2));

      // 🚀 API CALL
      const response = await fetch(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${OPENROUTER_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "meta-llama/llama-3-8b-instruct",
            messages,
            temperature: 0.8,
            max_tokens: 500,
            top_p: 0.9,
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ OpenRouter API error:", errorText);
        throw new Error("LLM API failed");
      }

      const data = await response.json();

      const aiResponse =
        data?.choices?.[0]?.message?.content ||
        "I'm not sure how to respond.";

      console.log("✅ AI Response:", aiResponse);

      return aiResponse.trim();
    } catch (error) {
      console.error("❌ LLM Error:", error.message);
      return "⚠️ AI is temporarily unavailable. Try again.";
    }
  },

  // ✅ SUMMARY
  async summarizeConversation(messages) {
    try {
      const cleanMessages = messages.map((msg) => ({
        role: msg.isAIMessage ? "assistant" : "user",
        content: msg.content
          .replace(/^admin\d+:\s*/, "")
          .replace(/^user\d+:\s*/, "")
          .trim(),
      }));

      const prompt = `
Summarize this conversation in 2-3 sentences:

${cleanMessages.map((m) => `${m.role}: ${m.content}`).join("\n")}
`;

      return await this.generateResponse(prompt);
    } catch (error) {
      console.error("Summarization Error:", error);
      throw new Error("Failed to summarize conversation");
    }
  },

  // ✅ SENTIMENT (STRICT OUTPUT)
  async analyzeSentiment(text) {
    try {
      const prompt = `
Classify sentiment in ONE word: positive, negative, or neutral.

Text: "${text}"
Answer:
`;

      const sentiment = await this.generateResponse(prompt);

      return sentiment.toLowerCase().trim();
    } catch (error) {
      console.error("Sentiment Error:", error);
      return "neutral";
    }
  },

  // ✅ SMART REPLY
  async generateSmartReply(message, context = "") {
    try {
      const prompt = `
Write a short, professional reply.

Message: "${message}"
${context ? `Context: ${context}` : ""}

Reply:
`;

      return await this.generateResponse(prompt);
    } catch (error) {
      console.error("Smart Reply Error:", error);
      throw new Error("Failed to generate reply");
    }
  },
};

module.exports = aiService;