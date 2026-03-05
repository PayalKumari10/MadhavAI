/**
 * DashboardVoiceSummary Service
 * Provides voice-based dashboard summary
 */

import {SupportedLanguage} from '../../types/voice.types';
import TextToSpeech from './TextToSpeech';

/**
 * Dashboard data for voice summary
 */
interface DashboardData {
  weather?: {
    temperature: number;
    conditions: string;
    rainfall?: number;
  };
  alerts?: Array<{
    title: string;
    priority: string;
  }>;
  cropStatus?: {
    currentCrop: string;
    stage: string;
    nextActivity: string;
  };
  marketPrices?: Array<{
    crop: string;
    price: number;
  }>;
  recommendations?: Array<{
    type: string;
    summary: string;
  }>;
}

/**
 * Service for generating and speaking dashboard summaries
 */
class DashboardVoiceSummary {
  private tts: TextToSpeech;
  private currentLanguage: SupportedLanguage = 'hi-IN';

  constructor(tts: TextToSpeech) {
    this.tts = tts;
  }

  /**
   * Generate and speak complete dashboard summary
   */
  async speakDashboardSummary(data: DashboardData): Promise<void> {
    const summary = this.generateSummary(data);
    await this.tts.speak(summary, this.currentLanguage);
  }

  /**
   * Generate summary text from dashboard data
   */
  private generateSummary(data: DashboardData): string {
    const parts: string[] = [];

    // Greeting
    parts.push(this.getGreeting());

    // Weather summary
    if (data.weather) {
      parts.push(this.getWeatherSummary(data.weather));
    }

    // Alerts summary
    if (data.alerts && data.alerts.length > 0) {
      parts.push(this.getAlertsSummary(data.alerts));
    }

    // Crop status
    if (data.cropStatus) {
      parts.push(this.getCropStatusSummary(data.cropStatus));
    }

    // Market prices
    if (data.marketPrices && data.marketPrices.length > 0) {
      parts.push(this.getMarketPricesSummary(data.marketPrices));
    }

    // Recommendations
    if (data.recommendations && data.recommendations.length > 0) {
      parts.push(this.getRecommendationsSummary(data.recommendations));
    }

    return parts.join('. ');
  }

  /**
   * Get greeting based on time of day
   */
  private getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) {
      return 'Good morning';
    } else if (hour < 17) {
      return 'Good afternoon';
    } else {
      return 'Good evening';
    }
  }

  /**
   * Generate weather summary
   */
  private getWeatherSummary(weather: DashboardData['weather']): string {
    if (!weather) return '';

    let summary = `Today's weather: ${weather.conditions}, temperature ${weather.temperature} degrees`;

    if (weather.rainfall && weather.rainfall > 0) {
      summary += `, expected rainfall ${weather.rainfall} millimeters`;
    }

    return summary;
  }

  /**
   * Generate alerts summary
   */
  private getAlertsSummary(alerts: DashboardData['alerts']): string {
    if (!alerts || alerts.length === 0) return '';

    const highPriorityAlerts = alerts.filter(a => a.priority === 'high' || a.priority === 'critical');

    if (highPriorityAlerts.length > 0) {
      return `You have ${highPriorityAlerts.length} important alert${highPriorityAlerts.length > 1 ? 's' : ''}: ${highPriorityAlerts.map(a => a.title).join(', ')}`;
    }

    return `You have ${alerts.length} alert${alerts.length > 1 ? 's' : ''}`;
  }

  /**
   * Generate crop status summary
   */
  private getCropStatusSummary(cropStatus: DashboardData['cropStatus']): string {
    if (!cropStatus) return '';

    return `Your ${cropStatus.currentCrop} is in ${cropStatus.stage} stage. Next activity: ${cropStatus.nextActivity}`;
  }

  /**
   * Generate market prices summary
   */
  private getMarketPricesSummary(prices: DashboardData['marketPrices']): string {
    if (!prices || prices.length === 0) return '';

    const priceStrings = prices.slice(0, 3).map(p => `${p.crop} at ${p.price} rupees per quintal`);

    return `Current market prices: ${priceStrings.join(', ')}`;
  }

  /**
   * Generate recommendations summary
   */
  private getRecommendationsSummary(recommendations: DashboardData['recommendations']): string {
    if (!recommendations || recommendations.length === 0) return '';

    const count = recommendations.length;
    return `You have ${count} new recommendation${count > 1 ? 's' : ''} available`;
  }

  /**
   * Speak individual section
   */
  async speakSection(section: keyof DashboardData, data: any): Promise<void> {
    let text = '';

    switch (section) {
      case 'weather':
        text = this.getWeatherSummary(data);
        break;
      case 'alerts':
        text = this.getAlertsSummary(data);
        break;
      case 'cropStatus':
        text = this.getCropStatusSummary(data);
        break;
      case 'marketPrices':
        text = this.getMarketPricesSummary(data);
        break;
      case 'recommendations':
        text = this.getRecommendationsSummary(data);
        break;
    }

    if (text) {
      await this.tts.speak(text, this.currentLanguage);
    }
  }

  /**
   * Set current language
   */
  setLanguage(language: SupportedLanguage): void {
    this.currentLanguage = language;
  }

  /**
   * Stop speaking
   */
  async stop(): Promise<void> {
    await this.tts.stop();
  }
}

export default DashboardVoiceSummary;
