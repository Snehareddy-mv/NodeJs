const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;

const aiService = {
  async generateResponse(prompt, conversationHistory = []) {
    if (!genAI || !process.env.GEMINI_API_KEY) {
      return "AI service is not configured. Please add GEMINI_API_KEY to your .env file. For now, I'm a placeholder response!";
    }
    
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });

      const chat = model.startChat({
        history: conversationHistory.map(msg => ({
          role: msg.role,
          parts: [{ text: msg.content }],
        })),
        generationConfig: {
          maxOutputTokens: 1000,
          temperature: 0.7,
        },
      });

      const result = await chat.sendMessage(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error("AI Service Error:", error);
      return "Sorry, I'm having trouble connecting to the AI service right now. Please try again later or check your API key configuration.";
    }
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
