import { describe, it, expect, beforeEach } from '@jest/globals';
import { Logger } from '../utils/logger';

// Mock console.log for testing
const originalConsoleLog = console.log;
let consoleLogs: string[] = [];

beforeEach(() => {
  consoleLogs = [];
  console.log = jest.fn((message: string) => {
    consoleLogs.push(message);
  });
});

afterEach(() => {
  console.log = originalConsoleLog;
});

describe('Logger', () => {
  describe('log levels', () => {
    it('should log error messages when level is error', () => {
      const logger = new Logger('error');
      logger.error('Test error message');
      
      expect(consoleLogs).toHaveLength(1);
      const logEntry = JSON.parse(consoleLogs[0]);
      expect(logEntry.level).toBe('error');
      expect(logEntry.message).toBe('Test error message');
      expect(logEntry.timestamp).toBeDefined();
    });

    it('should not log debug messages when level is error', () => {
      const logger = new Logger('error');
      logger.debug('Test debug message');
      
      expect(consoleLogs).toHaveLength(0);
    });

    it('should log info messages when level is info', () => {
      const logger = new Logger('info');
      logger.info('Test info message', { key: 'value' });
      
      expect(consoleLogs).toHaveLength(1);
      const logEntry = JSON.parse(consoleLogs[0]);
      expect(logEntry.level).toBe('info');
      expect(logEntry.message).toBe('Test info message');
      expect(logEntry.meta).toEqual({ key: 'value' });
    });
  });

  describe('helper methods', () => {
    it('should log request with proper format', () => {
      const logger = new Logger('info');
      logger.logRequest('GET', '/health', 200, 150, 'req-123', 'user-456');
      
      expect(consoleLogs).toHaveLength(1);
      const logEntry = JSON.parse(consoleLogs[0]);
      expect(logEntry.level).toBe('info');
      expect(logEntry.message).toBe('HTTP Request');
      expect(logEntry.meta).toEqual({
        method: 'GET',
        path: '/health',
        statusCode: 200,
        responseTime: 150,
      });
      expect(logEntry.requestId).toBe('req-123');
      expect(logEntry.userId).toBe('user-456');
    });

    it('should log errors with stack trace', () => {
      const logger = new Logger('info');
      const error = new Error('Test error');
      logger.logError(error, 'Test context', 'req-123');
      
      expect(consoleLogs).toHaveLength(1);
      const logEntry = JSON.parse(consoleLogs[0]);
      expect(logEntry.level).toBe('error');
      expect(logEntry.message).toBe('Test context: Test error');
      expect(logEntry.meta.stack).toBeDefined();
      expect(logEntry.meta.name).toBe('Error');
    });
  });
});