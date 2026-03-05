/**
 * VoiceService
 * Main voice interface service that integrates speech recognition and command handling
 * Supports voice input for search and data entry
 */

import {
  SupportedLanguage,
  VoiceCommandResult,
  VoiceServiceState,
  SpeechRecognitionResult,
} from '../../types/voice.types';
import SpeechRecognizer from './SpeechRecognizer';
import VoiceCommandHandler from './VoiceCommandHandler';
import TextToSpeech from './TextToSpeech';

/**
 * Main voice service for speech-to-text, text-to-speech, and command processing
 */
class VoiceService {
  private speechRecognizer: SpeechRecognizer;
  private commandHandler: VoiceCommandHandler;
  private textToSpeech: TextToSpeech;
  private currentLanguage: SupportedLanguage = 'hi-IN';
  private isListening: boolean = false;
  private lastTranscript: string = '';

  constructor() {
    this.speechRecognizer = new SpeechRecognizer();
    this.commandHandler = new VoiceCommandHandler();
    this.textToSpeech = new TextToSpeech();
    this.setupRecognitionCallbacks();
  }

  /**
   * Setup callbacks for speech recognition events
   */
  private setupRecognitionCallbacks(): void {
    this.speechRecognizer.onResult((result: SpeechRecognitionResult) => {
      if (result.isFinal) {
        this.lastTranscript = result.transcript;
      }
    });

    this.speechRecognizer.onError((error: Error) => {
      console.error('Speech recognition error:', error);
      this.isListening = false;
    });
  }

  /**
   * Check if voice service is available
   */
  async isAvailable(): Promise<boolean> {
    return await this.speechRecognizer.isAvailable();
  }

  /**
   * Start listening for voice input
   */
  async startListening(language: SupportedLanguage): Promise<void> {
    if (this.isListening) {
      throw new Error('Already listening');
    }

    this.currentLanguage = language;
    this.commandHandler.setLanguage(language);
    this.lastTranscript = '';

    await this.speechRecognizer.startListening(language, {
      continuous: false,
      interimResults: true,
      maxAlternatives: 1,
    });

    this.isListening = true;
  }

  /**
   * Stop listening and return the recognized text
   */
  async stopListening(): Promise<string> {
    if (!this.isListening) {
      throw new Error('Not currently listening');
    }

    const transcript = await this.speechRecognizer.stopListening();
    this.isListening = false;

    // Use last transcript if available
    return transcript || this.lastTranscript;
  }

  /**
   * Cancel voice recognition
   */
  async cancel(): Promise<void> {
    if (!this.isListening) {
      return;
    }

    await this.speechRecognizer.cancel();
    this.isListening = false;
    this.lastTranscript = '';
  }

  /**
   * Process a voice command from recognized text
   */
  async processVoiceCommand(command: string): Promise<VoiceCommandResult> {
    if (!command || command.trim().length === 0) {
      return {
        understood: false,
        action: 'unknown',
        parameters: {},
        response: 'No command received',
      };
    }

    return await this.commandHandler.processCommand(command);
  }

  /**
   * Listen and process command in one step
   */
  async listenAndProcess(language: SupportedLanguage): Promise<VoiceCommandResult> {
    await this.startListening(language);

    // Wait for speech recognition to complete
    // In production, this would be event-driven
    await new Promise<void>(resolve => setTimeout(resolve, 3000));

    const transcript = await this.stopListening();

    if (!transcript) {
      return {
        understood: false,
        action: 'unknown',
        parameters: {},
        response: 'No speech detected',
      };
    }

    return await this.processVoiceCommand(transcript);
  }

  /**
   * Get current voice service state
   */
  getState(): VoiceServiceState {
    return {
      isListening: this.isListening,
      isSpeaking: this.textToSpeech.getIsSpeaking(),
      currentLanguage: this.currentLanguage,
      isAvailable: true,
    };
  }

  /**
   * Get supported languages
   */
  async getSupportedLanguages(): Promise<SupportedLanguage[]> {
    return await this.speechRecognizer.getSupportedLanguages();
  }

  /**
   * Set current language
   */
  setLanguage(language: SupportedLanguage): void {
    this.currentLanguage = language;
    this.commandHandler.setLanguage(language);
  }

  /**
   * Get current language
   */
  getCurrentLanguage(): SupportedLanguage {
    return this.currentLanguage;
  }

  /**
   * Register a custom result callback
   */
  onResult(callback: (result: SpeechRecognitionResult) => void): void {
    this.speechRecognizer.onResult(callback);
  }

  /**
   * Register a custom error callback
   */
  onError(callback: (error: Error) => void): void {
    this.speechRecognizer.onError(callback);
  }

  /**
   * Register a partial result callback
   */
  onPartialResult(callback: (result: SpeechRecognitionResult) => void): void {
    this.speechRecognizer.onPartialResult(callback);
  }

  /**
   * Speak text using text-to-speech
   */
  async speak(text: string, language: SupportedLanguage): Promise<void> {
    await this.textToSpeech.speak(text, language);
  }

  /**
   * Stop speaking
   */
  async stopSpeaking(): Promise<void> {
    await this.textToSpeech.stop();
  }

  /**
   * Get text-to-speech instance
   */
  getTextToSpeech(): TextToSpeech {
    return this.textToSpeech;
  }

  /**
   * Destroy the voice service and clean up resources
   */
  async destroy(): Promise<void> {
    if (this.isListening) {
      await this.cancel();
    }

    await this.speechRecognizer.destroy();
    await this.textToSpeech.destroy();
  }
}

export default VoiceService;
