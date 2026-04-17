# AI Assistant Setup Guide

## OpenRouter API Integration

Your ChatGenius application now uses **OpenRouter** with **Mistral-7B-Instruct** for dynamic, intelligent AI responses.

### Features
- 🤖 Natural, ChatGPT-like conversations
- 💬 Context-aware responses using conversation history
- 📝 Intelligent conversation summarization
- 🔄 Automatic fallback to rule-based responses if API fails
- ⚡ Fast and reliable

---

## Setup Instructions

### 1. Get Your Free OpenRouter API Key

1. Go to **https://openrouter.ai**
2. Click **"Sign Up"** (free account)
3. After signing in, go to **https://openrouter.ai/keys**
4. Click **"Create Key"**
5. Copy your API key (starts with `sk-or-v1-...`)

### 2. Add API Key to Your Environment

**For Local Development:**

1. Open your `Backend/.env` file
2. Add this line:
   ```
   OPENROUTER_API_KEY=sk-or-v1-your-actual-key-here
   ```
3. Save the file

**For Production (Render):**

1. Go to your Render backend dashboard
2. Click **"Environment"** in the left sidebar
3. Click **"Add Environment Variable"**
4. Add:
   - **Key:** `OPENROUTER_API_KEY`
   - **Value:** `sk-or-v1-your-actual-key-here`
5. Click **"Save Changes"**
6. Your service will automatically redeploy

### 3. Test the AI

Restart your backend:
```bash
cd Backend
npm start
```

Then test the AI in your frontend:
- Click "🤖 AI Assistant"
- Try: "Hello, how are you?"
- Try: "Tell me about channels"
- Try: "Summarize this conversation"

You should see natural, intelligent responses!

---

## How It Works

### With API Key (Primary Mode)
- Uses OpenRouter's Mistral-7B-Instruct model
- Sends conversation history for context
- Returns dynamic, intelligent responses
- Handles any question naturally

### Without API Key (Fallback Mode)
- Uses rule-based responses
- Handles common questions (greetings, help, etc.)
- Still functional but less dynamic

---

## API Limits

**OpenRouter Free Tier:**
- Free credits on signup
- Pay-as-you-go after credits
- Very affordable (~$0.0002 per request)
- Mistral-7B-Instruct is one of the cheapest models

**Cost Example:**
- 1,000 AI requests ≈ $0.20
- 10,000 AI requests ≈ $2.00

---

## Troubleshooting

**AI not responding dynamically?**
- Check if `OPENROUTER_API_KEY` is set in your `.env` file
- Verify the API key is correct (starts with `sk-or-v1-`)
- Check backend logs for errors

**Getting fallback responses?**
- This means the API key is missing or invalid
- Check your environment variables
- Restart your backend after adding the key

**API errors in logs?**
- Verify your OpenRouter account has credits
- Check if the API key is still valid
- Ensure you have internet connection

---

## Model Information

**Current Model:** `mistralai/mistral-7b-instruct`

**Why Mistral-7B?**
- ✅ Fast responses (< 1 second)
- ✅ High quality, ChatGPT-like
- ✅ Very affordable
- ✅ Good at conversations
- ✅ Supports context/history

**Want to try other models?**
Edit `Backend/services/aiService.js` line 52:
```javascript
model: 'mistralai/mistral-7b-instruct',  // Change this
```

**Other good models:**
- `meta-llama/llama-3.1-8b-instruct` (Better quality, slightly more expensive)
- `google/gemini-flash-1.5` (Very fast, good quality)
- `anthropic/claude-3-haiku` (Best quality, more expensive)

See all models: https://openrouter.ai/models

---

## Support

Need help? Check:
- OpenRouter Docs: https://openrouter.ai/docs
- OpenRouter Discord: https://discord.gg/openrouter
- Your backend logs for detailed error messages

---

**Enjoy your intelligent AI assistant! 🎉**
