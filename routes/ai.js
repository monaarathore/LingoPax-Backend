const express = require('express');
const router = express.Router();
const { GoogleGenAI } = require('@google/genai');
require('dotenv').config();

const apiKey = process.env.GEMINI_API_KEY || process.env.gemini_key;
const ai = new GoogleGenAI({ apiKey: apiKey });

router.post('/chat', async (req, res) => {
  try {
    const { message, behaviour, history, targetRole, techStack } = req.body;

    if (!message) {
      return res.status(400).json({ message: "Payload parameter 'message' is required." });
    }

    let currentBehaviour = behaviour || 'Strict Client';
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('interview') || lowerMessage.includes('preparation') || lowerMessage.includes('prep')) {
      currentBehaviour = 'Job Interviewer';
    } else if (lowerMessage.includes('language') || lowerMessage.includes('learning') || lowerMessage.includes('learn')) {
      currentBehaviour = 'Tech Buddy'; 
    }

    const formattingRule = `
CRITICAL INTERACTIVE RULES:
1. NEVER use asterisks (** or *) anywhere in your output. Raw markdown stars are strictly forbidden.
2. Keep your answer natural, user-friendly, and interactive in plain English text paragraphs.
3. Keep answers short and concise (max 2-3 sentences) so the audio narration plays smoothly without lag.
4. Do not dump codes or list blocks unless asked explicitly.
`;

    let systemInstruction = `You are LingoPax, a helpful language learning coach. ${formattingRule}`;

    if (currentBehaviour === 'Strict Client') {
      systemInstruction = `Act as a professional but direct corporate tech client. ${formattingRule} Critique bugs bluntly.`;
    } 
    else if (currentBehaviour === 'Tech Buddy') {
      systemInstruction = `Act as a casual developer peer helping the user learn and perfect their conversational English. ${formattingRule} Use normal developer slangs naturally.`;
    } 
    else if (currentBehaviour === 'Job Interviewer') {
      systemInstruction = `
        You are an elite corporate technical interviewer vetting a candidate for a ${targetRole || "Software Engineer"} vacancy specialized in ${techStack || "Coding Architecture"}.
        ${formattingRule}
        CRITICAL FLOW:
        1. Welcome them warmly in exactly 1 short sentence (Only on the first turn).
        2. Ask exactly ONE targeted technical question or real-world system architecture challenge matching their stack to start the interview. Do not dump multiple questions.
      `;
    }

    // 🟢 PARSING THE SIMPLIFIED CLEAN HISTORY STRUCTURE
    let conversationContext = "";
    if (Array.isArray(history)) {
      conversationContext = history.map(h => {
        const roleLabel = h.role === 'user' ? 'User' : 'AI';
        return `${roleLabel}: ${h.text || ''}`;
      }).join("\n") + "\n";
    }

    const finalPrompt = `${conversationContext}User Current Message: ${message}\nRespond back based on your persona rules.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [{ text: finalPrompt }] }],
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.4,
        maxOutputTokens: 300,
      }
    });

    let aiReply = response && response.text ? response.text.replace(/\*/g, '') : "System synchronized. Let's proceed.";

    return res.json({ 
      reply: aiReply,
      detectedBehaviour: currentBehaviour 
    });

  } catch (err) {
    console.error("🔥 INTERNAL SERVER ERROR TRACE:", err);
    return res.status(500).json({ 
      message: 'Internal Server Error in Gemini Pipeline.',
      errorDetails: err.message 
    });
  }
});

module.exports = router;