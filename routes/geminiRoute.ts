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
   STREAM ANALYZE (⚡ FAST)
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

      // 🔥 VERY IMPORTANT HEADERS (SSE)
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      // Stream chunks
      for await (const chunk of stream) {
        const text = chunk.text;
        if (text) {
          res.write(`data: ${text}\n\n`);
        }
      }

      res.end();
    } catch (error: any) {
      console.error("Gemini Analyze Error:", error);
      res.write(`event: error\ndata: ${JSON.stringify({ error: error.message })}\n\n`);
      res.end();
    }
  }
);

/* ───────────────────────────────────────────────────────────────
   STREAM CHAT (⚡ FAST)
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
      const stream = await chatFollowUpStream(
        messages,
        diagnosis,
        language
      );

      // 🔥 SSE HEADERS
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      for await (const chunk of stream) {
        const text = chunk.text;
        if (text) {
          res.write(`data: ${text}\n\n`);
        }
      }

      res.end();
    } catch (error: any) {
      console.error("Gemini Chat Error:", error);
      res.write(`event: error\ndata: ${JSON.stringify({ error: error.message })}\n\n`);
      res.end();
    }
  }
);

export default router;