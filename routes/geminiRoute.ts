import express from "express";
import {
  analyzeFromImageAndText,
  analyzeFromTextOnly,
  chatFollowUp,
} from "../services/geminiService";
import { Language } from "../types/types";

const router = express.Router();

interface AnalyzeRequest {
  description?: string;
  imageBase64?: string;
  mimeType?: string;
  language?: Language;
}

interface ChatRequest {
  messages: { role: "user" | "assistant"; content: string }[];
  diagnosis: {
    conditionName: string;
    confidence: string;
    description: string;
    disclaimer: string;
    potentialCauses: string[];
    generalAdvice: string[];
    whenToSeeDoctor: string[];
    preventionAndCare: string[];
  };
  language?: Language;
}

// ── POST /api/gemini/analyze ──────────────────────────────────────────────────
router.post(
  "/analyze",
  async (req: express.Request<{}, {}, AnalyzeRequest>, res: express.Response) => {
    const { description, imageBase64, mimeType, language } = req.body;

    try {
      let response;

      if (imageBase64 && mimeType) {
        response = await analyzeFromImageAndText(
          description ?? "",
          imageBase64,
          mimeType,
          language
        );
      } else {
        response = await analyzeFromTextOnly(description ?? "", language);
      }

      const parsed = JSON.parse(
        response.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}"
      );

      res.json(parsed);
    } catch (error: any) {
      console.error("Gemini Analyze Error:", error);
      res.status(500).json({ error: error?.message || "Internal Server Error" });
    }
  }
);

// ── POST /api/gemini/chat ─────────────────────────────────────────────────────
router.post(
  "/chat",
  async (req: express.Request<{}, {}, ChatRequest>, res: express.Response) => {
    const { messages, diagnosis, language } = req.body;

    if (!messages || !diagnosis) {
      res.status(400).json({ error: "messages and diagnosis are required." });
      return;
    }

    try {
      const reply = await chatFollowUp(messages, diagnosis, language);
      res.json({ reply });
    } catch (error: any) {
      console.error("Gemini Chat Error:", error);
      res.status(500).json({ error: error?.message || "Internal Server Error" });
    }
  }
);

export default router;