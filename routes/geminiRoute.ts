import express from "express";
import { analyzeFromImageAndText, analyzeFromTextOnly } from "../services/geminiService";

const router = express.Router();

// Handles POST http://YOUR_IP:5000/api/gemini/analyze
router.post("/analyze", async (req, res) => {
  const { description, imageBase64, mimeType, language } = req.body;

  try {
    let response;

    if (imageBase64 && mimeType) {
      response = await analyzeFromImageAndText(description ?? "", imageBase64, mimeType, language);
    } else {
      response = await analyzeFromTextOnly(description ?? "", language);
    }

    // Since we used responseMimeType: "application/json", response.text is already clean
    const parsed = JSON.parse(response.text);

    // Send the result in the exact format your frontend index.tsx expects
    res.json(parsed);

  } catch (error: any) {
    console.error("Gemini Error:", error);
    res.status(500).json({ error: error?.message || "Internal Server Error" });
  }
});

export default router;