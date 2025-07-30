import { Hono } from 'hono';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import { AuthRequest, AuthResponse } from '../types';
import { config, findUserByUsername } from '../config';
import { logger } from '../utils/logger';

const auth = new Hono();

// Validation schema for auth request
const authSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required')
});

auth.post('/', async (c) => {
  const startTime = process.hrtime();
  
  try {
    // Parse and validate request body
    const body = await c.req.json();
    const validationResult = authSchema.safeParse(body);
    
    if (!validationResult.success) {
      logger.warn('Authentication failed - Invalid request body', {
        errors: validationResult.error.errors
      });
      
      const response: AuthResponse = {
        success: false,
        message: 'Invalid request body'
      };
      
      return c.json(response, 400);
    }

    const { username, password }: AuthRequest = validationResult.data;

    // Find user
    const user = findUserByUsername(username);
    if (!user) {
      logger.warn('Authentication failed - User not found', { username });
      
      const response: AuthResponse = {
        success: false,
        message: 'Invalid credentials'
      };
      
      return c.json(response, 401);
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      logger.warn('Authentication failed - Invalid password', { username });
      
      const response: AuthResponse = {
        success: false,
        message: 'Invalid credentials'
      };
      
      return c.json(response, 401);
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        username: user.username 
      },
      config.jwtSecret,
      { 
        expiresIn: '24h',
        issuer: 'k8snode-api',
        audience: 'k8snode-client'
      }
    );

    const endTime = process.hrtime(startTime);
    const responseTimeMs = (endTime[0] * 1000) + (endTime[1] / 1000000);

    logger.info('Authentication successful', {
      username,
      userId: user.id,
      responseTime: `${responseTimeMs.toFixed(2)}ms`
    });

    const response: AuthResponse = {
      success: true,
      message: 'Authentication successful',
      token,
      user: {
        id: user.id,
        username: user.username
      }
    };

    return c.json(response);

  } catch (error) {
    logger.error('Authentication error', { 
      error: error instanceof Error ? error.message : String(error) 
    });
    
    const response: AuthResponse = {
      success: false,
      message: 'Internal server error'
    };
    
    return c.json(response, 500);
  }
});

export default auth;