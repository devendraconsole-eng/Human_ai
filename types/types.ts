export enum Language {
  EN = 'en',
  HI = 'hi',
}

export interface Translation {
  title: string;
  selectImage: string;
  orDragAndDrop: string;
  imageRequirements: string;
  detectButton: string;
  detecting: string;
  translating: string;
  error: string;
  tryAgain: string;
  analysisTitle: string;
  condition: string;
  confidence: string;
  high: string;
  medium: string;
  low: string;
  description: string;
  potentialCauses: string;
  generalAdvice: string;
  whenToSeeDoctor: string;
  preventionAndCare: string;
  imageQualityWarningTitle: string;
  insufficientInfoWarningTitle: string;
  imageQualityWarningText: string;
  chatPlaceholder: string;
  sendMessage: string;
  chatTitle: string;
  initialMessage: string;
  disclaimerTitle: string;
  disclaimerText: string;
  scanAnother: string;
  describeSymptomsPlaceholder: string;
  camera: string;
  upload: string;
  text: string;
}

export type Translations = {
  [key in Language]: Translation;
};

export interface AIConditionDiagnosis {
  conditionName: string;
  confidence: 'High' | 'Medium' | 'Low';
  description: string;
  disclaimer: string;
  potentialCauses: string[];
  generalAdvice: string[];
  whenToSeeDoctor: string[];
  preventionAndCare: string[];
}

export interface AIResponse {
  imageQuality: 'good' | 'bad';
  feedback: string;
  diagnosis?: AIConditionDiagnosis | null;
}

export interface ChatMessage {
  sender: 'user' | 'ai';
  text: string;
}