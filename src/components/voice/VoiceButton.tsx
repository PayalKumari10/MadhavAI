/**
 * VoiceButton Component
 * Reusable voice input button for voice commands
 */

import React from 'react';
import {TouchableOpacity, Text, StyleSheet, ActivityIndicator} from 'react-native';
import {useVoice} from '../../hooks/useVoice';
import {SupportedLanguage, VoiceCommandResult} from '../../types/voice.types';

interface VoiceButtonProps {
  language?: SupportedLanguage;
  onCommandResult?: (result: VoiceCommandResult) => void;
  onTranscript?: (transcript: string) => void;
  disabled?: boolean;
  style?: any;
}

/**
 * Voice input button component
 */
const VoiceButton: React.FC<VoiceButtonProps> = ({
  language = 'hi-IN',
  onCommandResult,
  onTranscript,
  disabled = false,
  style,
}) => {
  const {isListening, isAvailable, listenAndProcess, error} = useVoice(language);

  const handlePress = async () => {
    if (disabled || isListening) {
      return;
    }

    try {
      const result = await listenAndProcess();

      if (onCommandResult) {
        onCommandResult(result);
      }

      if (onTranscript && result.understood) {
        onTranscript(result.response);
      }
    } catch (err) {
      console.error('Voice button error:', err);
    }
  };

  if (!isAvailable) {
    return null;
  }

  return (
    <TouchableOpacity
      style={[styles.button, disabled && styles.disabled, style]}
      onPress={handlePress}
      disabled={disabled || isListening}>
      {isListening ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <Text style={styles.buttonText}>🎤</Text>
      )}
      {error && <Text style={styles.error}>Error</Text>}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#4CAF50',
    borderRadius: 30,
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  disabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    fontSize: 24,
  },
  error: {
    position: 'absolute',
    bottom: -20,
    fontSize: 10,
    color: 'red',
  },
});

export default VoiceButton;
