/**
 * VoiceRecommendationReader Service
 * Reads recommendations aloud using text-to-speech
 */

import { SupportedLanguage } from '../../types/voice.types';
import TextToSpeech from './TextToSpeech';

/**
 * Recommendation data structure
 */
interface Recommendation {
  type: 'crop' | 'fertilizer' | 'seed';
  title: string;
  suitabilityScore?: number;
  explanation?: string;
  details?: string[];
}

/**
 * Service for reading recommendations aloud
 */
class VoiceRecommendationReader {
  private tts: TextToSpeech;
  private currentLanguage: SupportedLanguage = 'hi-IN';

  constructor(tts: TextToSpeech) {
    this.tts = tts;
  }

  /**
   * Read a single recommendation
   */
  async readRecommendation(recommendation: Recommendation): Promise<void> {
    const text = this.formatRecommendation(recommendation);
    await this.tts.speak(text, this.currentLanguage);
  }

  /**
   * Read multiple recommendations
   */
  async readRecommendations(recommendations: Recommendation[]): Promise<void> {
    if (recommendations.length === 0) {
      await this.tts.speak('No recommendations available', this.currentLanguage);
      return;
    }

    const intro = `You have ${recommendations.length} recommendation${
      recommendations.length > 1 ? 's' : ''
    }`;
    await this.tts.speak(intro, this.currentLanguage);

    for (let i = 0; i < recommendations.length; i++) {
      const prefix = `Recommendation ${i + 1}`;
      const text = `${prefix}. ${this.formatRecommendation(recommendations[i])}`;
      await this.tts.speak(text, this.currentLanguage);
    }
  }

  /**
   * Read recommendation summary (without details)
   */
  async readSummary(recommendations: Recommendation[]): Promise<void> {
    if (recommendations.length === 0) {
      await this.tts.speak('No recommendations available', this.currentLanguage);
      return;
    }

    const summaries = recommendations.map((rec, i) => {
      const score = rec.suitabilityScore ? ` with ${rec.suitabilityScore} percent suitability` : '';
      return `${i + 1}. ${rec.title}${score}`;
    });

    const text = `You have ${recommendations.length} recommendations: ${summaries.join('. ')}`;
    await this.tts.speak(text, this.currentLanguage);
  }

  /**
   * Format recommendation for speech
   */
  private formatRecommendation(recommendation: Recommendation): string {
    const parts: string[] = [];

    // Title
    parts.push(recommendation.title);

    // Suitability score
    if (recommendation.suitabilityScore !== undefined) {
      parts.push(`Suitability score: ${recommendation.suitabilityScore} percent`);
    }

    // Explanation
    if (recommendation.explanation) {
      parts.push(recommendation.explanation);
    }

    // Details
    if (recommendation.details && recommendation.details.length > 0) {
      parts.push(`Details: ${recommendation.details.join('. ')}`);
    }

    return parts.join('. ');
  }

  /**
   * Set current language
   */
  setLanguage(language: SupportedLanguage): void {
    this.currentLanguage = language;
  }

  /**
   * Stop reading
   */
  async stop(): Promise<void> {
    await this.tts.stop();
  }
}

export default VoiceRecommendationReader;
