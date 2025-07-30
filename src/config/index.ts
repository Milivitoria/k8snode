import bcrypt from 'bcrypt';
import { Config } from '../types';

export const config: Config = {
  port: parseInt(process.env.PORT || '3000', 10),
  environment: process.env.NODE_ENV || 'development',
  version: process.env.APP_VERSION || '1.0.0',
  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  },
  users: [
    {
      id: '1',
      username: 'admin',
      password: bcrypt.hashSync('admin123', 10),
    },
    {
      id: '2', 
      username: 'user',
      password: bcrypt.hashSync('user123', 10),
    },
  ],
};

export default config;