import express from "express";
import { analyzeFromImageAndText, analyzeFromTextOnly } from "../services/geminiService";
import { Language } from "../types/types";

const router = express.Router();

interface AnalyzeRequest {
  description?: string;
  imageBase64?: string;
  mimeType?: string;
  language?: Language;
}

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
        response = await analyzeFromTextOnly(
          description ?? "",
          language
        );
      }

      const parsed = JSON.parse(
        response.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}"
      );

      res.json(parsed);

    } catch (error: any) {
      console.error("Gemini Route Error:", error);
      res.status(500).json({ error: error?.message || "Internal Server Error" });
    }
  }
);

export default router;