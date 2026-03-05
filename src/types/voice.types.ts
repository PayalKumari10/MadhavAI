/**
 * Voice Interface Types
 * Defines types for voice recognition, text-to-speech, and voice commands
 */

/**
 * Supported regional languages for voice interface
 */
export type SupportedLanguage =
  | 'hi-IN' // Hindi
  | 'ta-IN' // Tamil
  | 'te-IN' // Telugu
  | 'kn-IN' // Kannada
  | 'mr-IN' // Marathi
  | 'bn-IN' // Bengali
  | 'gu-IN' // Gujarati
  | 'pa-IN' // Punjabi
  | 'ml-IN' // Malayalam
  | 'or-IN'; // Odia

/**
 * Voice command result after processing
 */
export interface VoiceCommandResult {
  understood: boolean;
  action: string;
  parameters: {[key: string]: any};
  response: string;
}

/**
 * Voice recognition options
 */
export interface VoiceRecognitionOptions {
  language: SupportedLanguage;
  continuous?: boolean;
  interimResults?: boolean;
  maxAlternatives?: number;
}

/**
 * Text-to-speech options
 */
export interface TextToSpeechOptions {
  language: SupportedLanguage;
  pitch?: number;
  rate?: number;
  volume?: number;
}

/**
 * Voice command types
 */
export enum VoiceCommandType {
  WEATHER = 'weather',
  MARKET_PRICES = 'market_prices',
  SCHEMES = 'schemes',
  TRAINING = 'training',
  RECOMMENDATIONS = 'recommendations',
  DASHBOARD = 'dashboard',
  ALERTS = 'alerts',
  SOIL_HEALTH = 'soil_health',
  NAVIGATION = 'navigation',
  SEARCH = 'search',
  UNKNOWN = 'unknown',
}

/**
 * Voice command definition
 */
export interface VoiceCommand {
  type: VoiceCommandType;
  keywords: string[];
  handler: (params: any) => Promise<VoiceCommandResult>;
}

/**
 * Speech recognition result
 */
export interface SpeechRecognitionResult {
  transcript: string;
  confidence: number;
  isFinal: boolean;
}

/**
 * Voice service state
 */
export interface VoiceServiceState {
  isListening: boolean;
  isSpeaking: boolean;
  currentLanguage: SupportedLanguage;
  isAvailable: boolean;
}

/**
 * Voice navigation item
 */
export interface VoiceNavigationItem {
  screen: string;
  keywords: string[];
  description: string;
}
