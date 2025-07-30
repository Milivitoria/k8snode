export interface User {
  id: string;
  username: string;
  password: string;
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

export interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  metadata?: Record<string, any> | undefined;
}

export interface AppConfig {
  port: number;
  environment: string;
  jwtSecret: string;
  corsOrigins: string[];
}