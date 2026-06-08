const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI, Type } = require('@google/generative-ai'); // 👈 Type import kiya structural safety ke liye
const authMiddleware = require('../middleware/auth');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

//  WEBCAM IMAGE FRAME ANALYSIS ENDPOINT
router.post('/analyze-frame', authMiddleware, async (req, res) => {
  try {
    const { imageBase64 } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ message: 'No image frame captured' });
    }

    // Base64 string se image buffer data extract 
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
    
    const imagePart = {
      inlineData: {
        data: base64Data,
        mimeType: "image/jpeg"
      },
    };

    const promptInstruction = `
      Analyze this user's webcam snapshot from a technical interview or professional workspace setting.
      Evaluate their posture, eye-contact, and facial expressions. 
      Return the output strictly matching the requested JSON schema layout.
    `;

    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            confidenceScore: { type: Type.INTEGER, description: "Score between 40 and 100 based on posture and focus" },
            primaryExpression: { type: Type.STRING, description: "One word describing expression: Focused, Nervous, Neutral etc." },
            quickFeedback: { type: Type.STRING, description: "Max 2 short sentences bullet points suggesting actionable posture or focus improvement" }
          },
          required: ["confidenceScore", "primaryExpression", "quickFeedback"],
        },
      }
    });

    const result = await model.generateContent([promptInstruction, imagePart]);
    const response = await result.response;
    const aiText = response.text();

    // Ab parsing 100% crash-free hogi kyunki response clean JSON hi aayega
    const metricsData = JSON.parse(aiText.trim());

    res.json(metricsData);

  } catch (err) {
    console.error("Mirror Lab Analysis Failure:", err);
    res.status(500).json({ message: 'Visual analytics parsing engine failed.' });
  }
});

module.exports = router;