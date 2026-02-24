import express from "express";
import { analyzeFromImageAndText, analyzeFromTextOnly } from "../services/geminiService";

const router = express.Router();

router.post("/analyze", async (req, res) => {
  const { description, imageBase64, mimeType } = req.body;

  try {
    let rawResult: string;

    if (imageBase64 && mimeType) {
      rawResult = await analyzeFromImageAndText(description ?? "", imageBase64, mimeType);
    } else {
      rawResult = await analyzeFromTextOnly(description ?? "");
    }

    // Strip markdown code fences if Gemini wraps response
    const cleaned = rawResult.replace(/```json|```/g, "").trim();

    let parsed: any;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      // Fallback if Gemini doesn't return valid JSON
      parsed = {
        severity: "normal",
        condition: "Analysis Complete",
        summary: cleaned,
        recommendations: ["Please consult a healthcare professional for accurate diagnosis."],
        seekImmediateCare: false,
      };
    }

    res.json({ result: parsed });
  } catch (error: any) {
    console.error("Gemini error:", error);
    res.status(500).json({ error: error?.message ?? "Analysis failed" });
  }
});

export default router;