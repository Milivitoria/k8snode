import { User, AppConfig } from '../types';
import * as bcrypt from 'bcryptjs';

export const config: AppConfig = {
  port: parseInt(process.env['PORT'] || '3000', 10),
  nodeEnv: process.env['NODE_ENV'] || 'development',
  jwtSecret: process.env['JWT_SECRET'] || 'your-super-secret-jwt-key-change-in-production',
  jwtExpiresIn: process.env['JWT_EXPIRES_IN'] || '24h',
  logLevel: process.env['LOG_LEVEL'] || 'info',
};

// Pre-configured users with bcrypt hashed passwords
export const users: User[] = [
  {
    id: '1',
    username: 'admin',
    password: '$2a$12$Wn/jsNA7fSp2fWc8nBY2NuFEpe9pSp6733WhKjmjXw/lJEkv0Mj0e', // admin123
  },
  {
    id: '2', 
    username: 'user',
    password: '$2a$12$cnKkruEFenDLt7dsRSjU/uxCeYCGmqYgQ/C0N3uvmmR12kFh7vA3W', // user123
  },
  {
    id: '3',
    username: 'test',
    password: '$2a$12$ONcMBmMD6MOqXmbuJVDw3.FlIh7K8LWGCR1pVqwNbVrRSjJAMVxHq', // test123
  },
];

// Helper function to find user by username
export const findUserByUsername = (username: string): User | undefined => {
  return users.find(user => user.username === username);
};

// Helper function to verify password
export const verifyPassword = async (plainPassword: string, hashedPassword: string): Promise<boolean> => {
  try {
    return await bcrypt.compare(plainPassword, hashedPassword);
  } catch (error) {
    return false;
  }
};

// Helper function to hash password (for development/testing)
export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
};

// Environment validation
export const validateEnvironment = (): void => {
  const requiredEnvVars = ['JWT_SECRET'];
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0 && config.nodeEnv === 'production') {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }
};