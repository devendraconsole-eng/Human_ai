import dotenv from "dotenv";
dotenv.config();

import { GoogleGenAI, Type } from "@google/genai";
import { Language } from "../types/types";

if (!process.env.API_KEY) {
  throw new Error("API_KEY not found in .env file");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// ── Response schema for /analyze ──────────────────────────────────────────────
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

// ── Base prompt for /analyze ──────────────────────────────────────────────────
const getBasePrompt = (targetLanguage: string) => `
  You are a Wellness AI for the "Human Disease Detector" app.
  
  CRITICAL INSTRUCTIONS:
  1. If the image quality is "good", you MUST fully populate the 'diagnosis' JSON object. Do not leave it null.
  2. Even though the object is called 'diagnosis', use ONLY observational language. 
  3. For 'conditionName', provide a descriptive observational name (e.g., "Ring-shaped Skin Rash", "Red Scaly Patches") instead of a definitive medical disease name.
  4. If the image quality is "bad" or irrelevant to human health, set 'imageQuality' to 'bad', leave 'diagnosis' as null, and explain why in the 'feedback' field.
  
  MANDATORY: Place this exact disclaimer in the 'disclaimer' field in ${targetLanguage}: "IMPORTANT: This is an AI observation and not a medical diagnosis. Always consult a healthcare professional."
  
  Respond completely in ${targetLanguage}.
`;

// ── analyzeFromImageAndText ───────────────────────────────────────────────────
export const analyzeFromImageAndText = async (
  description: string,
  imageBase64: string,
  mimeType: string,
  language: Language = Language.EN
) => {
  const targetLanguage = language === Language.HI ? "Hindi" : "English";
  const prompt = `${getBasePrompt(targetLanguage)}\nUser Details: ${description}`;

  const result = await ai.models.generateContent({
    model: "gemini-1.5-flash",
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

  return result;
};

// ── analyzeFromTextOnly ───────────────────────────────────────────────────────
export const analyzeFromTextOnly = async (
  description: string,
  language: Language = Language.EN
) => {
  const targetLanguage = language === Language.HI ? "Hindi" : "English";
  const prompt = `${getBasePrompt(targetLanguage)}\nAnalyze: ${description}`;

  const result = await ai.models.generateContent({
    model: "gemini-1.5-flash",
    contents: [{ parts: [{ text: prompt }] }],
    config: {
      responseMimeType: "application/json",
      responseSchema,
      temperature: 0.3,
    },
  });

  return result;
};

// ── chatFollowUp ──────────────────────────────────────────────────────────────
export const chatFollowUp = async (
  messages: { role: "user" | "assistant"; content: string }[],
  diagnosis: {
    conditionName: string;
    confidence: string;
    description: string;
    disclaimer: string;
    potentialCauses: string[];
    generalAdvice: string[];
    whenToSeeDoctor: string[];
    preventionAndCare: string[];
  },
  language: Language = Language.EN
): Promise<string> => {
  const targetLanguage = language === Language.HI ? "Hindi" : "English";

  // Build a system context summarising the diagnosis for the model
  const systemContext = `
You are a helpful Wellness AI assistant for the "Human Disease Detector" app.
A user has just received the following AI health observation:

Condition: ${diagnosis.conditionName}
Confidence: ${diagnosis.confidence}
Description: ${diagnosis.description}
Potential Causes: ${diagnosis.potentialCauses.join(", ")}
General Advice: ${diagnosis.generalAdvice.join(", ")}
When to See a Doctor: ${diagnosis.whenToSeeDoctor.join(", ")}
Prevention & Care: ${diagnosis.preventionAndCare.join(", ")}

IMPORTANT RULES:
- Answer the user's follow-up questions about this observation only.
- Always use observational language — never give a definitive medical diagnosis.
- Always remind the user to consult a qualified healthcare professional for medical advice.
- Be concise, friendly, and helpful.
- Respond entirely in ${targetLanguage}.
  `.trim();

  // Convert messages array into a single conversation string
  // (Google GenAI simple text generation — no multi-turn chat API needed)
  const conversationHistory = messages
    .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
    .join("\n");

  const fullPrompt = `${systemContext}\n\nConversation so far:\n${conversationHistory}\n\nAssistant:`;

  const result = await ai.models.generateContent({
    model: "gemini-1.5-flash",
    contents: [{ parts: [{ text: fullPrompt }] }],
    config: {
      temperature: 0.5,
    },
  });

  const reply =
    result.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ??
    "I'm sorry, I couldn't generate a response. Please try again.";

  return reply;
};