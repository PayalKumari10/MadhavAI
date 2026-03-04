/**
 * Unit tests for OTP Service
 */

import { otpService } from '../OTPService';
import { OTP_EXPIRATION_MS } from '../../../config/constants';

describe('OTPService', () => {
  beforeEach(() => {
    // Clear any existing OTP records before each test
    jest.clearAllMocks();
  });

  describe('sendOTP', () => {
    it('should generate and send OTP for valid mobile number', async () => {
      const mobileNumber = '9876543210';
      const response = await otpService.sendOTP(mobileNumber);

      expect(response.success).toBe(true);
      expect(response.attemptsRemaining).toBe(3);
      expect(response.expiresAt).toBeInstanceOf(Date);
      expect(response.message).toBe('OTP sent successfully');
    });

    it('should reject invalid mobile number format', async () => {
      const invalidNumbers = ['123456789', '12345678901', '0123456789', 'abcdefghij'];

      for (const number of invalidNumbers) {
        const response = await otpService.sendOTP(number);
        expect(response.success).toBe(false);
        expect(response.message).toBe('Invalid mobile number format');
      }
    });

    it('should generate 6-digit OTP', async () => {
      const mobileNumber = '9876543210';
      await otpService.sendOTP(mobileNumber);

      const otp = otpService.getOTPForTesting(mobileNumber);
      expect(otp).toBeDefined();
      expect(otp?.length).toBe(6);
      expect(/^\d{6}$/.test(otp!)).toBe(true);
    });

    it('should set expiration time to 5 minutes', async () => {
      const mobileNumber = '9876543210';
      const beforeSend = Date.now();
      const response = await otpService.sendOTP(mobileNumber);
      const afterSend = Date.now();

      const expectedExpiration = beforeSend + OTP_EXPIRATION_MS;
      const actualExpiration = response.expiresAt.getTime();

      expect(actualExpiration).toBeGreaterThanOrEqual(expectedExpiration);
      expect(actualExpiration).toBeLessThanOrEqual(afterSend + OTP_EXPIRATION_MS);
    });
  });

  describe('validateOTP', () => {
    it('should validate correct OTP', async () => {
      const mobileNumber = '9876543210';
      await otpService.sendOTP(mobileNumber);
      const otp = otpService.getOTPForTesting(mobileNumber)!;

      const result = otpService.validateOTP(mobileNumber, otp);

      expect(result.isValid).toBe(true);
      expect(result.isExpired).toBe(false);
      expect(result.isLocked).toBe(false);
    });

    it('should reject incorrect OTP', async () => {
      const mobileNumber = '9876543210';
      await otpService.sendOTP(mobileNumber);

      const result = otpService.validateOTP(mobileNumber, '000000');

      expect(result.isValid).toBe(false);
      expect(result.attemptsRemaining).toBe(2);
    });

    it('should lock after 3 failed attempts', async () => {
      const mobileNumber = '9876543210';
      await otpService.sendOTP(mobileNumber);

      // First attempt
      let result = otpService.validateOTP(mobileNumber, '000000');
      expect(result.attemptsRemaining).toBe(2);
      expect(result.isLocked).toBe(false);

      // Second attempt
      result = otpService.validateOTP(mobileNumber, '000000');
      expect(result.attemptsRemaining).toBe(1);
      expect(result.isLocked).toBe(false);

      // Third attempt
      result = otpService.validateOTP(mobileNumber, '000000');
      expect(result.attemptsRemaining).toBe(0);
      expect(result.isLocked).toBe(true);

      // Fourth attempt should still be locked
      result = otpService.validateOTP(mobileNumber, '000000');
      expect(result.isValid).toBe(false);
      expect(result.isLocked).toBe(true);
    });

    it('should reject OTP for non-existent mobile number', () => {
      const result = otpService.validateOTP('9999999999', '123456');

      expect(result.isValid).toBe(false);
      expect(result.attemptsRemaining).toBe(0);
    });

    it('should mark OTP as used after successful validation', async () => {
      const mobileNumber = '9876543210';
      await otpService.sendOTP(mobileNumber);
      const otp = otpService.getOTPForTesting(mobileNumber)!;

      // First validation should succeed
      let result = otpService.validateOTP(mobileNumber, otp);
      expect(result.isValid).toBe(true);

      // Second validation with same OTP should fail (already used)
      result = otpService.validateOTP(mobileNumber, otp);
      expect(result.isValid).toBe(false);
      expect(result.isLocked).toBe(true);
    });
  });

  describe('clearOTP', () => {
    it('should clear OTP record', async () => {
      const mobileNumber = '9876543210';
      await otpService.sendOTP(mobileNumber);

      otpService.clearOTP(mobileNumber);

      const result = otpService.validateOTP(mobileNumber, '123456');
      expect(result.isValid).toBe(false);
      expect(result.attemptsRemaining).toBe(0);
    });
  });
});
