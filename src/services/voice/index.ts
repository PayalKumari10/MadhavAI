/**
 * Voice Service Module
 * Exports voice-related services and utilities
 */

export {default as VoiceService} from './VoiceService';
export {default as SpeechRecognizer} from './SpeechRecognizer';
export {default as VoiceCommandHandler} from './VoiceCommandHandler';
export {default as TextToSpeech} from './TextToSpeech';
export {default as VoiceNavigation} from './VoiceNavigation';
export {default as DashboardVoiceSummary} from './DashboardVoiceSummary';
export {default as VoiceRecommendationReader} from './VoiceRecommendationReader';
export {
  default as VoiceIntegrationManager,
  getVoiceIntegrationManager,
} from './VoiceIntegrationManager';
export * from './VoiceCommandActions';
