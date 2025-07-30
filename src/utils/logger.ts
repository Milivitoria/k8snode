import { LogLevel } from '../types';

class Logger {
  private formatLog(level: LogLevel['level'], message: string, metadata?: Record<string, any>): LogLevel {
    return {
      level,
      message,
      timestamp: new Date().toISOString(),
      metadata,
    };
  }

  private log(logData: LogLevel): void {
    console.log(JSON.stringify(logData));
  }

  info(message: string, metadata?: Record<string, any>): void {
    this.log(this.formatLog('info', message, metadata));
  }

  error(message: string, metadata?: Record<string, any>): void {
    this.log(this.formatLog('error', message, metadata));
  }

  warn(message: string, metadata?: Record<string, any>): void {
    this.log(this.formatLog('warn', message, metadata));
  }

  debug(message: string, metadata?: Record<string, any>): void {
    if (process.env.NODE_ENV === 'development') {
      this.log(this.formatLog('debug', message, metadata));
    }
  }
}

export const logger = new Logger();
export default logger;