import express from "express";
import {
  analyzeFromImageAndTextStream,
  analyzeFromTextOnlyStream,
  chatFollowUpStream,
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
  diagnosis: any;
  language?: Language;
}

/* ───────────────────────────────────────────────────────────────
   ANALYZE — returns plain JSON (works on Hermes/APK)
──────────────────────────────────────────────────────────────── */
router.post(
  "/analyze",
  async (req: express.Request<{}, {}, AnalyzeRequest>, res: express.Response) => {
    const { description, imageBase64, mimeType, language } = req.body;

    try {
      let stream;

      if (imageBase64 && mimeType) {
        stream = await analyzeFromImageAndTextStream(
          description ?? "",
          imageBase64,
          mimeType,
          language
        );
      } else {
        stream = await analyzeFromTextOnlyStream(
          description ?? "",
          language
        );
      }

      // ✅ Collect full streamed response from Gemini
      let fullText = "";
      for await (const chunk of stream) {
        const text = chunk.text;
        if (text) fullText += text;
      }

      // ✅ Parse and return as plain JSON — works on all platforms
      const parsed = JSON.parse(fullText);
      res.json(parsed);

    } catch (error: any) {
      console.error("Gemini Analyze Error:", error);
      res.status(500).json({ error: error.message });
    }
  }
);

/* ───────────────────────────────────────────────────────────────
   CHAT — returns plain JSON (works on Hermes/APK)
──────────────────────────────────────────────────────────────── */
router.post(
  "/chat",
  async (req: express.Request<{}, {}, ChatRequest>, res: express.Response) => {
    const { messages, diagnosis, language } = req.body;

    if (!messages || !diagnosis) {
      res.status(400).json({ error: "messages and diagnosis are required." });
      return;
    }

    try {
      const stream = await chatFollowUpStream(messages, diagnosis, language);

      // ✅ Collect full streamed response from Gemini
      let reply = "";
      for await (const chunk of stream) {
        const text = chunk.text;
        if (text) reply += text;
      }

      // ✅ Return as plain JSON
      res.json({ reply });

    } catch (error: any) {
      console.error("Gemini Chat Error:", error);
      res.status(500).json({ error: error.message });
    }
  }
);

export default router;