/**
 * VoiceCommandActions
 * Defines common voice command actions across modules
 */

import {VoiceCommandType} from '../../types/voice.types';

/**
 * Voice command action definitions
 */
export interface VoiceAction {
  command: VoiceCommandType;
  keywords: string[];
  description: string;
  handler: string; // Handler function name
}

/**
 * Common voice commands for all modules
 */
export const COMMON_VOICE_COMMANDS: VoiceAction[] = [
  // Weather commands
  {
    command: VoiceCommandType.WEATHER,
    keywords: ['weather', 'mausam', 'forecast', 'rain', 'temperature'],
    description: 'Get weather information',
    handler: 'handleWeather',
  },
  {
    command: VoiceCommandType.WEATHER,
    keywords: ['weather advice', 'farming advice', 'kheti salah'],
    description: 'Get weather-based farming advice',
    handler: 'handleWeatherAdvice',
  },

  // Market prices commands
  {
    command: VoiceCommandType.MARKET_PRICES,
    keywords: ['price', 'market', 'mandi', 'bhav', 'rate'],
    description: 'Get market prices',
    handler: 'handleMarketPrices',
  },
  {
    command: VoiceCommandType.MARKET_PRICES,
    keywords: ['price trend', 'bhav trend', 'market trend'],
    description: 'Get price trends',
    handler: 'handlePriceTrends',
  },

  // Schemes commands
  {
    command: VoiceCommandType.SCHEMES,
    keywords: ['scheme', 'yojana', 'subsidy', 'government', 'sarkar'],
    description: 'Browse government schemes',
    handler: 'handleSchemes',
  },
  {
    command: VoiceCommandType.SCHEMES,
    keywords: ['eligible scheme', 'my scheme', 'meri yojana'],
    description: 'Check eligible schemes',
    handler: 'handleEligibleSchemes',
  },

  // Training commands
  {
    command: VoiceCommandType.TRAINING,
    keywords: ['training', 'learn', 'lesson', 'siksha', 'video'],
    description: 'Access training lessons',
    handler: 'handleTraining',
  },
  {
    command: VoiceCommandType.TRAINING,
    keywords: ['continue lesson', 'resume lesson'],
    description: 'Continue last lesson',
    handler: 'handleContinueLesson',
  },

  // Recommendations commands
  {
    command: VoiceCommandType.RECOMMENDATIONS,
    keywords: ['crop recommendation', 'fasal salah'],
    description: 'Get crop recommendations',
    handler: 'handleCropRecommendations',
  },
  {
    command: VoiceCommandType.RECOMMENDATIONS,
    keywords: ['fertilizer recommendation', 'khad salah'],
    description: 'Get fertilizer recommendations',
    handler: 'handleFertilizerRecommendations',
  },
  {
    command: VoiceCommandType.RECOMMENDATIONS,
    keywords: ['seed recommendation', 'beej salah'],
    description: 'Get seed recommendations',
    handler: 'handleSeedRecommendations',
  },

  // Soil health commands
  {
    command: VoiceCommandType.SOIL_HEALTH,
    keywords: ['soil health', 'mitti swasthya', 'soil test'],
    description: 'Check soil health',
    handler: 'handleSoilHealth',
  },

  // Alerts commands
  {
    command: VoiceCommandType.ALERTS,
    keywords: ['alerts', 'reminders', 'chetavani', 'yaad'],
    description: 'View alerts and reminders',
    handler: 'handleAlerts',
  },
  {
    command: VoiceCommandType.ALERTS,
    keywords: ['today alerts', 'aaj ki chetavani'],
    description: 'View today\'s alerts',
    handler: 'handleTodayAlerts',
  },

  // Dashboard commands
  {
    command: VoiceCommandType.DASHBOARD,
    keywords: ['dashboard', 'home', 'summary', 'overview'],
    description: 'Go to dashboard',
    handler: 'handleDashboard',
  },
  {
    command: VoiceCommandType.DASHBOARD,
    keywords: ['read summary', 'dashboard summary'],
    description: 'Read dashboard summary',
    handler: 'handleDashboardSummary',
  },

  // Navigation commands
  {
    command: VoiceCommandType.NAVIGATION,
    keywords: ['go back', 'back', 'peeche'],
    description: 'Go back',
    handler: 'handleGoBack',
  },
  {
    command: VoiceCommandType.NAVIGATION,
    keywords: ['help', 'madad', 'commands'],
    description: 'Show help',
    handler: 'handleHelp',
  },

  // Search commands
  {
    command: VoiceCommandType.SEARCH,
    keywords: ['search', 'find', 'khojo'],
    description: 'Search',
    handler: 'handleSearch',
  },
];

/**
 * Get voice commands for a specific module
 */
export function getModuleCommands(commandType: VoiceCommandType): VoiceAction[] {
  return COMMON_VOICE_COMMANDS.filter(cmd => cmd.command === commandType);
}

/**
 * Get all available voice commands
 */
export function getAllVoiceCommands(): VoiceAction[] {
  return COMMON_VOICE_COMMANDS;
}

/**
 * Find command by keyword
 */
export function findCommandByKeyword(keyword: string): VoiceAction | undefined {
  const normalizedKeyword = keyword.toLowerCase().trim();
  return COMMON_VOICE_COMMANDS.find(cmd =>
    cmd.keywords.some(k => normalizedKeyword.includes(k.toLowerCase())),
  );
}
