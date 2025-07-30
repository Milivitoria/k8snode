import bcrypt from 'bcrypt';
import { User, AppConfig } from '../types';

// Application configuration
export const config: AppConfig = {
  port: parseInt(process.env['PORT'] || '3000'),
  environment: process.env['NODE_ENV'] || 'development',
  jwtSecret: process.env['JWT_SECRET'] || 'your-super-secret-jwt-key-change-in-production',
  corsOrigins: process.env['CORS_ORIGINS']?.split(',') || ['*']
};

// Pre-configured users (in production, this would come from a database)
export const users: User[] = [
  {
    id: '1',
    username: 'admin',
    password: bcrypt.hashSync('admin123', 10)
  },
  {
    id: '2',
    username: 'user',
    password: bcrypt.hashSync('user123', 10)
  }
];

// Find user by username
export const findUserByUsername = (username: string): User | undefined => {
  return users.find(user => user.username === username);
};