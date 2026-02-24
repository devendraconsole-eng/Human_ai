import dotenv from "dotenv";
dotenv.config({ path: ".env" });

import { GoogleGenAI } from "@google/genai";

if (!process.env.API_KEY) {
  throw new Error("API_KEY not found in .env file");
}

const ai = new GoogleGenAI({
  apiKey: process.env.API_KEY,
});

export const analyzeFromText = async (description: string): Promise<string> => {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [{ parts: [{ text: description }] }],
  });

  return response.text ?? "";
};

const SYSTEM_PROMPT = `You are a general wellness AI assistant that helps users understand visual observations and symptoms. You do NOT diagnose, prescribe, or replace professional medical advice.

Analyze the provided image and/or symptom description and respond ONLY with a valid JSON object in this exact format (no markdown, no extra text, no code fences):

{
  "severity": "critical" | "moderate" | "normal",
  "condition": "Brief name of the possible observation (e.g. 'Possible skin irritation', 'Mild redness', 'No visible concern')",
  "summary": "2-3 sentences written conversationally as an AI assistant sharing an observation, not a diagnosis. Use language like 'This appears to show...', 'The image suggests...', 'Based on the description...'",
  "recommendations": [
    "Actionable self-care tip or lifestyle suggestion",
    "When to consult a doctor (use gentle language like 'consider speaking with a healthcare provider')",
    "One more practical tip"
  ],
  "seekImmediateCare": true | false
}

Severity rules:
- "critical": the observation suggests something that may need prompt professional attention
- "moderate": worth monitoring and seeing a doctor if it persists or worsens
- "normal": no concerning signs observed

IMPORTANT: Always use observational, non-diagnostic language. Never claim to diagnose. Remind users this is for informational purposes. Always respond with ONLY the raw JSON object.`;

export const analyzeFromImageAndText = async (
  description: string,
  imageBase64: string,
  mimeType: string
): Promise<string> => {
  const parts: any[] = [
    { text: SYSTEM_PROMPT },
    { inlineData: { mimeType, data: imageBase64 } },
  ];

  if (description.trim()) {
    parts.push({ text: `Additional patient description: ${description}` });
  }

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [{ parts }],
  });

  return response.text ?? "";
};

export const analyzeFromTextOnly = async (description: string): Promise<string> => {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [
      {
        parts: [
          { text: SYSTEM_PROMPT },
          { text: `Patient description: ${description}` },
        ],
      },
    ],
  });

  return response.text ?? "";
};