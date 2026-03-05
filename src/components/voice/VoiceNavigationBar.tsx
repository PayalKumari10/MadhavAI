/**
 * VoiceNavigationBar Component
 * Voice-enabled navigation bar for major features
 */

import React, {useState} from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import {useVoice} from '../../hooks/useVoice';
import {SupportedLanguage} from '../../types/voice.types';

interface VoiceNavigationBarProps {
  language?: SupportedLanguage;
  onNavigate?: (screen: string) => void;
}

/**
 * Voice-enabled navigation bar
 */
const VoiceNavigationBar: React.FC<VoiceNavigationBarProps> = ({
  language = 'hi-IN',
  onNavigate,
}) => {
  const {isListening, speak, listenAndProcess} = useVoice(language);
  const [activeScreen, setActiveScreen] = useState('Dashboard');

  const handleVoiceNavigation = async () => {
    const result = await listenAndProcess();

    if (result.understood && result.action === 'navigation') {
      const screen = result.parameters.screen || 'Dashboard';
      setActiveScreen(screen);

      if (onNavigate) {
        onNavigate(screen);
      }

      await speak(`Navigating to ${screen}`);
    }
  };

  const navigationItems = [
    {name: 'Dashboard', icon: '🏠'},
    {name: 'Weather', icon: '🌤️'},
    {name: 'Market', icon: '💰'},
    {name: 'Schemes', icon: '📋'},
    {name: 'Training', icon: '📚'},
  ];

  return (
    <View style={styles.container}>
      <View style={styles.navItems}>
        {navigationItems.map(item => (
          <TouchableOpacity
            key={item.name}
            style={[styles.navItem, activeScreen === item.name && styles.activeNavItem]}
            onPress={() => {
              setActiveScreen(item.name);
              if (onNavigate) {
                onNavigate(item.name);
              }
            }}>
            <Text style={styles.icon}>{item.icon}</Text>
            <Text style={styles.navText}>{item.name}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={styles.voiceButton}
        onPress={handleVoiceNavigation}
        disabled={isListening}>
        <Text style={styles.voiceIcon}>{isListening ? '⏺️' : '🎤'}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingVertical: 8,
    paddingHorizontal: 4,
    alignItems: 'center',
  },
  navItems: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  navItem: {
    alignItems: 'center',
    padding: 8,
  },
  activeNavItem: {
    backgroundColor: '#e8f5e9',
    borderRadius: 8,
  },
  icon: {
    fontSize: 24,
    marginBottom: 4,
  },
  navText: {
    fontSize: 10,
    color: '#333',
  },
  voiceButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  voiceIcon: {
    fontSize: 24,
  },
});

export default VoiceNavigationBar;
