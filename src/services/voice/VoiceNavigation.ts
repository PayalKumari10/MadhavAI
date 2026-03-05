/**
 * VoiceNavigation Service
 * Provides voice-based navigation for major features
 */

import {VoiceNavigationItem, SupportedLanguage} from '../../types/voice.types';
import TextToSpeech from './TextToSpeech';

/**
 * Voice navigation service for hands-free app navigation
 */
class VoiceNavigation {
  private tts: TextToSpeech;
  private navigationItems: VoiceNavigationItem[] = [];
  private currentLanguage: SupportedLanguage = 'hi-IN';

  constructor(tts: TextToSpeech) {
    this.tts = tts;
    this.initializeNavigationItems();
  }

  /**
   * Initialize navigation items with keywords
   */
  private initializeNavigationItems(): void {
    this.navigationItems = [
      {
        screen: 'Dashboard',
        keywords: ['dashboard', 'home', 'main', 'mukhya'],
        description: 'Main dashboard with overview',
      },
      {
        screen: 'Weather',
        keywords: ['weather', 'mausam', 'climate'],
        description: 'Weather forecast and farming advice',
      },
      {
        screen: 'MarketPrices',
        keywords: ['market', 'price', 'mandi', 'bhav'],
        description: 'Market prices and selling guidance',
      },
      {
        screen: 'Schemes',
        keywords: ['scheme', 'yojana', 'subsidy', 'government'],
        description: 'Government schemes and subsidies',
      },
      {
        screen: 'Training',
        keywords: ['training', 'learn', 'lesson', 'siksha'],
        description: 'Training lessons and videos',
      },
      {
        screen: 'Recommendations',
        keywords: ['recommend', 'suggest', 'advice', 'salah'],
        description: 'Crop, fertilizer, and seed recommendations',
      },
      {
        screen: 'SoilHealth',
        keywords: ['soil', 'mitti', 'health', 'test'],
        description: 'Soil health analysis and recommendations',
      },
      {
        screen: 'Alerts',
        keywords: ['alert', 'reminder', 'notification', 'chetavani'],
        description: 'Alerts and reminders',
      },
    ];
  }

  /**
   * Navigate to a screen using voice command
   */
  async navigateByVoice(command: string): Promise<string | null> {
    const normalizedCommand = command.toLowerCase().trim();

    for (const item of this.navigationItems) {
      for (const keyword of item.keywords) {
        if (normalizedCommand.includes(keyword)) {
          await this.announceNavigation(item);
          return item.screen;
        }
      }
    }

    return null;
  }

  /**
   * Announce navigation to user
   */
  private async announceNavigation(item: VoiceNavigationItem): Promise<void> {
    const announcement = this.getNavigationAnnouncement(item);
    await this.tts.speak(announcement, this.currentLanguage);
  }

  /**
   * Get navigation announcement text
   */
  private getNavigationAnnouncement(item: VoiceNavigationItem): string {
    // In production, this would be localized based on currentLanguage
    return `Opening ${item.screen}`;
  }

  /**
   * List all available navigation options
   */
  async listNavigationOptions(): Promise<void> {
    const options = this.navigationItems
      .map(item => `${item.screen}: ${item.description}`)
      .join('. ');

    await this.tts.speak(`Available options: ${options}`, this.currentLanguage);
  }

  /**
   * Get navigation items
   */
  getNavigationItems(): VoiceNavigationItem[] {
    return this.navigationItems;
  }

  /**
   * Set current language
   */
  setLanguage(language: SupportedLanguage): void {
    this.currentLanguage = language;
  }
}

export default VoiceNavigation;
