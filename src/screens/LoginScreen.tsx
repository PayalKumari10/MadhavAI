/**
 * LoginScreen
 * Handles user authentication via OTP
 * Requirements: 1.1, 1.2, 1.3
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { authenticationManager } from '../services/auth/AuthenticationManager';
import { logger } from '../utils/logger';

interface LoginScreenProps {
  onLoginSuccess: (userId: string, token: string) => void;
}

export default function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const [mobileNumber, setMobileNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [loading, setLoading] = useState(false);
  const [attemptsRemaining, setAttemptsRemaining] = useState(3);
  const [timer, setTimer] = useState(0);

  // Start countdown timer for OTP expiration
  const startTimer = (expirationDate: Date) => {
    const interval = setInterval(() => {
      const now = new Date();
      const remaining = Math.floor((expirationDate.getTime() - now.getTime()) / 1000);

      if (remaining <= 0) {
        clearInterval(interval);
        setTimer(0);
      } else {
        setTimer(remaining);
      }
    }, 1000);
  };

  const handleSendOTP = async () => {
    if (!mobileNumber || mobileNumber.length !== 10) {
      Alert.alert('Invalid Number', 'Please enter a valid 10-digit mobile number');
      return;
    }

    try {
      setLoading(true);
      logger.info('Sending OTP to', mobileNumber);

      const response = await authenticationManager.sendOTP(mobileNumber);

      if (response.success) {
        setStep('otp');
        setAttemptsRemaining(response.attemptsRemaining);
        startTimer(response.expiresAt);
        Alert.alert('OTP Sent', 'Please check your SMS for the verification code');
      } else {
        Alert.alert('Error', response.message || 'Failed to send OTP');
      }
    } catch (error) {
      logger.error('Failed to send OTP', error);
      Alert.alert('Error', 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      Alert.alert('Invalid OTP', 'Please enter the 6-digit OTP');
      return;
    }

    try {
      setLoading(true);
      logger.info('Verifying OTP for', mobileNumber);

      // Get device ID (in production, use a proper device ID library)
      const deviceId = `device_${Date.now()}`;

      const result = await authenticationManager.verifyOTP(mobileNumber, otp, deviceId);

      if (result.success && result.authToken) {
        logger.info('Login successful');
        onLoginSuccess(result.authToken.userId, result.authToken.token);
      } else {
        Alert.alert('Verification Failed', result.message);

        // Update attempts remaining
        if (result.message.includes('attempts remaining')) {
          const match = result.message.match(/(\d+) attempts remaining/);
          if (match) {
            setAttemptsRemaining(parseInt(match[1], 10));
          }
        }
      }
    } catch (error) {
      logger.error('Failed to verify OTP', error);
      Alert.alert('Error', 'Failed to verify OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setOtp('');
    await handleSendOTP();
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (step === 'phone') {
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.logo}>🌾</Text>
            <Text style={styles.title}>MADHAV AI</Text>
            <Text style={styles.subtitle}>Farmer Decision Support Platform</Text>
          </View>

          <View style={styles.form}>
            <Text style={styles.label}>Enter Mobile Number</Text>
            <View style={styles.phoneInputContainer}>
              <Text style={styles.countryCode}>+91</Text>
              <TextInput
                style={styles.phoneInput}
                placeholder="9876543210"
                placeholderTextColor="#999"
                keyboardType="phone-pad"
                maxLength={10}
                value={mobileNumber}
                onChangeText={setMobileNumber}
                editable={!loading}
              />
            </View>

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleSendOTP}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Send OTP</Text>
              )}
            </TouchableOpacity>

            <Text style={styles.infoText}>We'll send you a 6-digit verification code via SMS</Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.logo}>🌾</Text>
          <Text style={styles.title}>Verify OTP</Text>
          <Text style={styles.subtitle}>Enter the code sent to +91 {mobileNumber}</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Enter OTP</Text>
          <TextInput
            style={styles.otpInput}
            placeholder="000000"
            placeholderTextColor="#999"
            keyboardType="number-pad"
            maxLength={6}
            value={otp}
            onChangeText={setOtp}
            editable={!loading}
            autoFocus
          />

          {timer > 0 && (
            <View style={styles.timerContainer}>
              <Text style={styles.timerText}>⏱️ Code expires in {formatTime(timer)}</Text>
            </View>
          )}

          {attemptsRemaining < 3 && (
            <View style={styles.attemptsContainer}>
              <Text style={styles.attemptsText}>{attemptsRemaining} attempts remaining</Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleVerifyOTP}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Verify & Login</Text>
            )}
          </TouchableOpacity>

          <View style={styles.resendContainer}>
            <Text style={styles.resendText}>Didn't receive the code?</Text>
            <TouchableOpacity onPress={handleResendOTP} disabled={loading || timer > 240}>
              <Text
                style={[styles.resendLink, (loading || timer > 240) && styles.resendLinkDisabled]}
              >
                Resend OTP
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              setStep('phone');
              setOtp('');
              setTimer(0);
            }}
          >
            <Text style={styles.backButtonText}>← Change Number</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logo: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  form: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 24,
    backgroundColor: '#F9F9F9',
  },
  countryCode: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginRight: 8,
  },
  phoneInput: {
    flex: 1,
    fontSize: 18,
    color: '#333',
    paddingVertical: 16,
  },
  otpInput: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingVertical: 16,
    marginBottom: 16,
    backgroundColor: '#F9F9F9',
    letterSpacing: 8,
  },
  button: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonDisabled: {
    backgroundColor: '#A5D6A7',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
  },
  timerContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  timerText: {
    fontSize: 14,
    color: '#F57C00',
    fontWeight: '500',
  },
  attemptsContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  attemptsText: {
    fontSize: 14,
    color: '#F44336',
    fontWeight: '500',
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  resendText: {
    fontSize: 14,
    color: '#666',
    marginRight: 4,
  },
  resendLink: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
  },
  resendLinkDisabled: {
    color: '#999',
  },
  backButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  backButtonText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '500',
  },
});
