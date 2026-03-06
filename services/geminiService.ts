import dotenv from "dotenv";
dotenv.config();

import { GoogleGenAI, Type } from "@google/genai";
import { Language } from "../types/types";

if (!process.env.API_KEY) {
  throw new Error("API_KEY not found in .env file");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Schema ensures Play Store compliance and UI stability
const responseSchema = {
  type: Type.OBJECT,
  properties: {
    imageQuality: { type: Type.STRING, enum: ['good', 'bad'] },
    feedback: { type: Type.STRING },
    diagnosis: {
      type: Type.OBJECT,
      nullable: true,
      properties: {
        conditionName: { type: Type.STRING },
        confidence: { type: Type.STRING, enum: ['High', 'Medium', 'Low'] },
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

const getBasePrompt = (targetLanguage: string) => `
  You are a Wellness AI for the "Human Disease Detector" app.
  CRITICAL: Use ONLY observational language (e.g., "appears to show"). 
  DO NOT DIAGNOSE. DO NOT PRESCRIBE.
  MANDATORY DISCLAIMER in ${targetLanguage}: "IMPORTANT: This is an AI observation and not a medical diagnosis. Consult a healthcare professional."
`;

export const analyzeFromImageAndText = async (
  description: string,
  imageBase64: string,
  mimeType: string,
  language: Language = 'en'
) => {
  const targetLanguage = language === 'hi' ? 'Hindi' : 'English';
  const prompt = `${getBasePrompt(targetLanguage)}\nUser Details: ${description}`;

  return await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [
      {
        parts: [
          { inlineData: { data: imageBase64, mimeType } },
          { text: prompt }
        ]
      }
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema,
      temperature: 0.2,
    }
  });
};

export const analyzeFromTextOnly = async (description: string, language: Language = 'en') => {
  const targetLanguage = language === 'hi' ? 'Hindi' : 'English';
  const prompt = `${getBasePrompt(targetLanguage)}\nAnalyze: ${description}`;

  return await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [{ parts: [{ text: prompt }] }],
    config: {
      responseMimeType: "application/json",
      responseSchema,
      temperature: 0.3,
    }
  });
};