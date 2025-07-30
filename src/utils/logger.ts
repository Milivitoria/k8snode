import { LogEntry, LogLevel } from '../types';

class Logger {
  private level: LogLevel;

  constructor(level: LogLevel = 'info') {
    this.level = level;
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: Record<LogLevel, number> = {
      error: 0,
      warn: 1,
      info: 2,
      debug: 3,
    };
    return levels[level] <= levels[this.level];
  }

  private formatLog(level: LogLevel, message: string, meta?: Record<string, any>, requestId?: string, userId?: string): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...(meta && { meta }),
      ...(requestId && { requestId }),
      ...(userId && { userId }),
    };
  }

  private writeLog(logEntry: LogEntry): void {
    console.log(JSON.stringify(logEntry));
  }

  error(message: string, meta?: Record<string, any>, requestId?: string, userId?: string): void {
    if (this.shouldLog('error')) {
      this.writeLog(this.formatLog('error', message, meta, requestId, userId));
    }
  }

  warn(message: string, meta?: Record<string, any>, requestId?: string, userId?: string): void {
    if (this.shouldLog('warn')) {
      this.writeLog(this.formatLog('warn', message, meta, requestId, userId));
    }
  }

  info(message: string, meta?: Record<string, any>, requestId?: string, userId?: string): void {
    if (this.shouldLog('info')) {
      this.writeLog(this.formatLog('info', message, meta, requestId, userId));
    }
  }

  debug(message: string, meta?: Record<string, any>, requestId?: string, userId?: string): void {
    if (this.shouldLog('debug')) {
      this.writeLog(this.formatLog('debug', message, meta, requestId, userId));
    }
  }

  // Request logging helpers
  logRequest(method: string, path: string, statusCode: number, responseTime: number, requestId: string, userId?: string): void {
    this.info('HTTP Request', {
      method,
      path,
      statusCode,
      responseTime,
    }, requestId, userId);
  }

  logError(error: Error, context?: string, requestId?: string, userId?: string): void {
    this.error(`${context ? `${context}: ` : ''}${error.message}`, {
      stack: error.stack,
      name: error.name,
    }, requestId, userId);
  }

  logAuth(username: string, success: boolean, ip?: string, userAgent?: string, requestId?: string): void {
    this.info('Authentication attempt', {
      username,
      success,
      ip,
      userAgent,
    }, requestId);
  }

  logHealthCheck(status: string, responseTime: number, requestId?: string): void {
    this.info('Health check', {
      status,
      responseTime,
    }, requestId);
  }
}

// Export singleton instance
export const logger = new Logger((process.env['LOG_LEVEL'] as LogLevel) || 'info');

// Export class for testing
export { Logger };