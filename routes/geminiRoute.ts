import express from "express";
import { analyzeFromImageAndText, analyzeFromTextOnly } from "../services/geminiService";

const router = express.Router();

interface AnalyzeRequest {
  description?: string;
  imageBase64?: string;
  mimeType?: string;
  language?: string;
}

interface AnalyzeResponse {
  text?: string;
}

router.post("/analyze", async (req: express.Request<{}, {}, AnalyzeRequest>, res: express.Response) => {
  // Extracting variables from request body
  const { description, imageBase64, mimeType, language } = req.body;

  try {
    let response: AnalyzeResponse;

    if (imageBase64 && mimeType) {
      // FIXED: Using ?? "" to ensure we never pass 'undefined' to a string parameter
      response = await analyzeFromImageAndText(
        description ?? "", 
        imageBase64, 
        mimeType, 
        language
      );
    } else {
      // FIXED: Using ?? "" for description
      response = await analyzeFromTextOnly(description ?? "", language);
    }

    // Parse and send the result
    const parsed = JSON.parse(response.text ?? "{}");
    res.json(parsed);

  } catch (error: any) {
    console.error("Gemini Route Error:", error);
    res.status(500).json({ error: error?.message || "Internal Server Error" });
  }
});

export default router;