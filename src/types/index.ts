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

export interface Config {
  port: number;
  environment: string;
  version: string;
  jwt: {
    secret: string;
    expiresIn: string;
  };
  users: User[];
}

export interface LogLevel {
  level: 'info' | 'error' | 'warn' | 'debug';
  message: string;
  timestamp: string;
  metadata?: Record<string, any>;
}