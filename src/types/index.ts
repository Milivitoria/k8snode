export interface User {
  id: string;
  username: string;
  password: string; // bcrypt hashed
}

export interface AuthRequest {
  username: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  token?: string;
  user?: {
    id: string;
    username: string;
  };
}

export interface HealthResponse {
  status: string;
  timestamp: string;
  version: string;
  environment: string;
  uptime: number;
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
}

export interface AppConfig {
  port: number;
  nodeEnv: string;
  jwtSecret: string;
  jwtExpiresIn: string;
  logLevel: string;
}

export interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  meta?: Record<string, any>;
  requestId?: string;
  userId?: string;
}

export type LogLevel = 'error' | 'warn' | 'info' | 'debug';

export interface ErrorResponse {
  success: false;
  message: string;
  error?: string;
  details?: Record<string, any>;
}