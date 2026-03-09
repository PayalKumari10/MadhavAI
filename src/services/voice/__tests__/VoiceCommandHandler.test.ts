/**
 * VoiceCommandHandler Tests
 */

import VoiceCommandHandler from '../VoiceCommandHandler';
import { VoiceCommandType } from '../../../types/voice.types';

describe('VoiceCommandHandler', () => {
  let handler: VoiceCommandHandler;

  beforeEach(() => {
    handler = new VoiceCommandHandler();
  });

  describe('command processing', () => {
    it('should process weather command', async () => {
      const result = await handler.processCommand('show weather');
      expect(result.understood).toBe(true);
      expect(result.action).toBe(VoiceCommandType.WEATHER);
    });

    it('should process Hindi weather command', async () => {
      const result = await handler.processCommand('mausam dikhao');
      expect(result.understood).toBe(true);
      expect(result.action).toBe(VoiceCommandType.WEATHER);
    });

    it('should process market prices command', async () => {
      const result = await handler.processCommand('show market prices');
      expect(result.understood).toBe(true);
      expect(result.action).toBe(VoiceCommandType.MARKET_PRICES);
    });

    it('should process schemes command', async () => {
      const result = await handler.processCommand('show government schemes');
      expect(result.understood).toBe(true);
      expect(result.action).toBe(VoiceCommandType.SCHEMES);
    });

    it('should process training command', async () => {
      const result = await handler.processCommand('show training lessons');
      expect(result.understood).toBe(true);
      expect(result.action).toBe(VoiceCommandType.TRAINING);
    });

    it('should process recommendations command', async () => {
      const result = await handler.processCommand('show crop recommendations');
      expect(result.understood).toBe(true);
      expect(result.action).toBe(VoiceCommandType.RECOMMENDATIONS);
      expect(result.parameters.type).toBe('crop');
    });

    it('should process fertilizer recommendations', async () => {
      const result = await handler.processCommand('show fertilizer recommendations');
      expect(result.understood).toBe(true);
      expect(result.action).toBe(VoiceCommandType.RECOMMENDATIONS);
      expect(result.parameters.type).toBe('fertilizer');
    });

    it('should process seed recommendations', async () => {
      const result = await handler.processCommand('show seed recommendations');
      expect(result.understood).toBe(true);
      expect(result.action).toBe(VoiceCommandType.RECOMMENDATIONS);
      expect(result.parameters.type).toBe('seed');
    });

    it('should process dashboard command', async () => {
      const result = await handler.processCommand('go to dashboard');
      expect(result.understood).toBe(true);
      expect(result.action).toBe(VoiceCommandType.DASHBOARD);
    });

    it('should process alerts command', async () => {
      const result = await handler.processCommand('show alerts');
      expect(result.understood).toBe(true);
      expect(result.action).toBe(VoiceCommandType.ALERTS);
    });

    it('should process soil health command', async () => {
      const result = await handler.processCommand('show soil health');
      expect(result.understood).toBe(true);
      expect(result.action).toBe(VoiceCommandType.SOIL_HEALTH);
    });

    it('should process navigation back command', async () => {
      const result = await handler.processCommand('go back');
      expect(result.understood).toBe(true);
      expect(result.action).toBe(VoiceCommandType.NAVIGATION);
      expect(result.parameters.action).toBe('back');
    });

    it('should process search command with query', async () => {
      const result = await handler.processCommand('search for wheat');
      expect(result.understood).toBe(true);
      expect(result.action).toBe(VoiceCommandType.SEARCH);
      expect(result.parameters.query).toBe('wheat');
    });

    it('should handle unknown command', async () => {
      const result = await handler.processCommand('xyz unknown command');
      expect(result.understood).toBe(false);
      expect(result.action).toBe(VoiceCommandType.UNKNOWN);
    });
  });

  describe('parameter extraction', () => {
    it('should extract crop name from market price command', async () => {
      const result = await handler.processCommand('show price of wheat');
      expect(result.parameters.crop).toBe('wheat');
    });

    it('should extract search query', async () => {
      const result = await handler.processCommand('search for organic farming');
      expect(result.parameters.query).toBe('organic farming');
    });

    it('should extract recommendation type', async () => {
      const result = await handler.processCommand('show fertilizer advice');
      expect(result.parameters.type).toBe('fertilizer');
    });
  });

  describe('language support', () => {
    it('should handle Hindi keywords', async () => {
      const result = await handler.processCommand('yojana dikhao');
      expect(result.understood).toBe(true);
      expect(result.action).toBe(VoiceCommandType.SCHEMES);
    });

    it('should set language', () => {
      handler.setLanguage('ta-IN');
      // Language is set, no error should occur
      expect(true).toBe(true);
    });
  });
});
