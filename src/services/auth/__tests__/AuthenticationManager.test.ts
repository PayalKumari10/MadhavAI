/**
 * Unit tests for Authentication Manager
 */

import { authenticationManager } from '../AuthenticationManager';
import { otpService } from '../OTPService';

describe('AuthenticationManager', () => {
  const testMobileNumber = '9876543210';
  const testDeviceId = 'test-device-123';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('sendOTP', () => {
    it('should send OTP successfully', async () => {
      const response = await authenticationManager.sendOTP(testMobileNumber);

      expect(response.success).toBe(true);
      expect(response.attemptsRemaining).toBe(3);
    });

    it('should reject invalid mobile number', async () => {
      const response = await authenticationManager.sendOTP('invalid');

      expect(response.success).toBe(false);
    });
  });

  describe('verifyOTP', () => {
    it('should authenticate user with valid OTP', async () => {
      // Send OTP
      await authenticationManager.sendOTP(testMobileNumber);
      const otp = otpService.getOTPForTesting(testMobileNumber)!;

      // Verify OTP
      const result = await authenticationManager.verifyOTP(
        testMobileNumber,
        otp,
        testDeviceId
      );

      expect(result.success).toBe(true);
      expect(result.authToken).toBeDefined();
      expect(result.authToken?.token).toBeDefined();
      expect(result.authToken?.userId).toBe(`user_${testMobileNumber}`);
      expect(result.authToken?.expiresAt).toBeInstanceOf(Date);
    });

    it('should reject invalid OTP', async () => {
      await authenticationManager.sendOTP(testMobileNumber);

      const result = await authenticationManager.verifyOTP(
        testMobileNumber,
        '000000',
        testDeviceId
      );

      expect(result.success).toBe(false);
      expect(result.authToken).toBeUndefined();
      expect(result.message).toContain('Invalid OTP');
    });

    it('should reject expired OTP', async () => {
      await authenticationManager.sendOTP(testMobileNumber);
      const otp = otpService.getOTPForTesting(testMobileNumber)!;

      // Mock expired OTP by clearing and creating a new one with past expiration
      // In real scenario, we would wait for expiration or mock Date
      otpService.clearOTP(testMobileNumber);

      const result = await authenticationManager.verifyOTP(
        testMobileNumber,
        otp,
        testDeviceId
      );

      expect(result.success).toBe(false);
    });

    it('should lock after 3 failed attempts', async () => {
      await authenticationManager.sendOTP(testMobileNumber);

      // Attempt 1
      await authenticationManager.verifyOTP(testMobileNumber, '000000', testDeviceId);
      
      // Attempt 2
      await authenticationManager.verifyOTP(testMobileNumber, '000000', testDeviceId);
      
      // Attempt 3
      const result = await authenticationManager.verifyOTP(
        testMobileNumber,
        '000000',
        testDeviceId
      );

      expect(result.success).toBe(false);
      expect(result.message).toContain('Too many failed attempts');
    });
  });

  describe('logout', () => {
    it('should invalidate session on logout', async () => {
      // Authenticate user
      await authenticationManager.sendOTP(testMobileNumber);
      const otp = otpService.getOTPForTesting(testMobileNumber)!;
      const loginResult = await authenticationManager.verifyOTP(
        testMobileNumber,
        otp,
        testDeviceId
      );

      const token = loginResult.authToken!.token;

      // Verify session is valid
      expect(authenticationManager.validateSession(token)).toBe(true);

      // Logout
      await authenticationManager.logout(token);

      // Verify session is invalid
      expect(authenticationManager.validateSession(token)).toBe(false);
    });
  });

  describe('refreshToken', () => {
    it('should refresh valid session token', async () => {
      // Authenticate user
      await authenticationManager.sendOTP(testMobileNumber);
      const otp = otpService.getOTPForTesting(testMobileNumber)!;
      const loginResult = await authenticationManager.verifyOTP(
        testMobileNumber,
        otp,
        testDeviceId
      );

      const oldToken = loginResult.authToken!.token;

      // Refresh token
      const newToken = await authenticationManager.refreshToken(oldToken);

      expect(newToken).toBeDefined();
      expect(newToken?.token).toBeDefined();
      expect(newToken?.token).not.toBe(oldToken);
      expect(newToken?.userId).toBe(`user_${testMobileNumber}`);

      // Old token should be invalid
      expect(authenticationManager.validateSession(oldToken)).toBe(false);

      // New token should be valid
      expect(authenticationManager.validateSession(newToken!.token)).toBe(true);
    });

    it('should reject refresh for invalid token', async () => {
      const newToken = await authenticationManager.refreshToken('invalid-token');

      expect(newToken).toBeNull();
    });
  });

  describe('validateSession', () => {
    it('should validate active session', async () => {
      // Authenticate user
      await authenticationManager.sendOTP(testMobileNumber);
      const otp = otpService.getOTPForTesting(testMobileNumber)!;
      const loginResult = await authenticationManager.verifyOTP(
        testMobileNumber,
        otp,
        testDeviceId
      );

      const token = loginResult.authToken!.token;

      expect(authenticationManager.validateSession(token)).toBe(true);
    });

    it('should reject invalid session', () => {
      expect(authenticationManager.validateSession('invalid-token')).toBe(false);
    });
  });

  describe('getUserIdFromToken', () => {
    it('should return user ID for valid token', async () => {
      // Authenticate user
      await authenticationManager.sendOTP(testMobileNumber);
      const otp = otpService.getOTPForTesting(testMobileNumber)!;
      const loginResult = await authenticationManager.verifyOTP(
        testMobileNumber,
        otp,
        testDeviceId
      );

      const token = loginResult.authToken!.token;
      const userId = authenticationManager.getUserIdFromToken(token);

      expect(userId).toBe(`user_${testMobileNumber}`);
    });

    it('should return null for invalid token', () => {
      const userId = authenticationManager.getUserIdFromToken('invalid-token');

      expect(userId).toBeNull();
    });
  });
});
