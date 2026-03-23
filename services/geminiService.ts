import dotenv from "dotenv";
dotenv.config();

import { GoogleGenAI, Type } from "@google/genai";
import { Language } from "../types/types";

if (!process.env.API_KEY) {
  throw new Error("API_KEY not found in .env file");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/* ─────────────────────────────────────────────
   RESPONSE SCHEMA
───────────────────────────────────────────── */
const responseSchema = {
  type: Type.OBJECT,
  properties: {
    imageQuality: { type: Type.STRING, enum: ["good", "bad"] },
    feedback: { type: Type.STRING },
    diagnosis: {
      type: Type.OBJECT,
      nullable: true,
      properties: {
        conditionName: { type: Type.STRING },
        confidence: { type: Type.STRING, enum: ["High", "Medium", "Low"] },
        description: { type: Type.STRING },
        disclaimer: { type: Type.STRING },
        potentialCauses: { type: Type.ARRAY, items: { type: Type.STRING } },
        generalAdvice: { type: Type.ARRAY, items: { type: Type.STRING } },
        whenToSeeDoctor: { type: Type.ARRAY, items: { type: Type.STRING } },
        preventionAndCare: { type: Type.ARRAY, items: { type: Type.STRING } },
      },
    },
  },
};

/* ─────────────────────────────────────────────
   BASE PROMPT
───────────────────────────────────────────── */
const getBasePrompt = (targetLanguage: string) => `
You are a Wellness AI for the "Human Disease Detector" app.

CRITICAL INSTRUCTIONS:
1. If the image quality is "good", you MUST fully populate the 'diagnosis' JSON object.
2. Use only observational language.
3. Do NOT give definitive medical diagnosis.
4. If image quality is bad → diagnosis must be null.

MANDATORY DISCLAIMER:
"IMPORTANT: This is an AI observation and not a medical diagnosis. Always consult a healthcare professional."

Respond fully in ${targetLanguage}.
`;

/* ─────────────────────────────────────────────
   IMAGE + TEXT ANALYSIS (STREAMING)
───────────────────────────────────────────── */
export const analyzeFromImageAndTextStream = async (
  description: string,
  imageBase64: string,
  mimeType: string,
  language: Language = Language.EN
) => {
  const targetLanguage = language === Language.HI ? "Hindi" : "English";

  const prompt = `${getBasePrompt(targetLanguage)}
User Details: ${description}`;

  const stream = await ai.models.generateContentStream({
    model: "gemini-2.5-flash",
    contents: [
      {
        parts: [
          { inlineData: { data: imageBase64, mimeType } },
          { text: prompt },
        ],
      },
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema,
      temperature: 0.2,
    },
  });

  return stream;
};

/* ─────────────────────────────────────────────
   TEXT ONLY ANALYSIS (STREAMING)
───────────────────────────────────────────── */
export const analyzeFromTextOnlyStream = async (
  description: string,
  language: Language = Language.EN
) => {
  const targetLanguage = language === Language.HI ? "Hindi" : "English";

  const prompt = `${getBasePrompt(targetLanguage)}
Analyze: ${description}`;

  const stream = await ai.models.generateContentStream({
    model: "gemini-2.5-flash",
    contents: [{ parts: [{ text: prompt }] }],
    config: {
      responseMimeType: "application/json",
      responseSchema,
      temperature: 0.3,
    },
  });

  return stream;
};

/* ─────────────────────────────────────────────
   CHAT FOLLOW-UP (STREAMING)
───────────────────────────────────────────── */
export const chatFollowUpStream = async (
  messages: { role: "user" | "assistant"; content: string }[],
  diagnosis: any,
  language: Language = Language.EN
) => {
  const targetLanguage = language === Language.HI ? "Hindi" : "English";

  const systemContext = `
You are a helpful Wellness AI assistant.

Observation:
Condition: ${diagnosis.conditionName}
Confidence: ${diagnosis.confidence}
Description: ${diagnosis.description}

Always use observational language.
Always recommend consulting a doctor.
Respond in ${targetLanguage}.
`;

  const history = messages
    .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
    .join("\n");

  const fullPrompt = `${systemContext}

Conversation:
${history}

Assistant:
`;

  const stream = await ai.models.generateContentStream({
    model: "gemini-2.5-flash",
    contents: [{ parts: [{ text: fullPrompt }] }],
    config: {
      temperature: 0.5,
    },
  });

  return stream;
};