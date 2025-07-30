import { LogEntry } from '../types';

class Logger {
  private formatTimestamp(): string {
    return new Date().toISOString();
  }

  private log(level: string, message: string, metadata?: Record<string, any> | undefined): void {
    const logEntry: LogEntry = {
      timestamp: this.formatTimestamp(),
      level: level.toUpperCase(),
      message,
      metadata
    };

    console.log(JSON.stringify(logEntry));
  }

  info(message: string, metadata?: Record<string, any> | undefined): void {
    this.log('info', message, metadata);
  }

  error(message: string, metadata?: Record<string, any> | undefined): void {
    this.log('error', message, metadata);
  }

  warn(message: string, metadata?: Record<string, any> | undefined): void {
    this.log('warn', message, metadata);
  }

  debug(message: string, metadata?: Record<string, any> | undefined): void {
    this.log('debug', message, metadata);
  }

  http(message: string, metadata?: Record<string, any> | undefined): void {
    this.log('http', message, metadata);
  }
}

export const logger = new Logger();