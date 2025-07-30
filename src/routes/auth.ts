import { Hono } from 'hono';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { AuthRequest, AuthResponse, User } from '../types';
import { config } from '../config';
import { logger } from '../utils/logger';

export const authRoute = new Hono();

// Validation schema for authentication request
const authSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

authRoute.post('/', async (c) => {
  try {
    // Parse and validate request body
    const body = await c.req.json();
    const validationResult = authSchema.safeParse(body);

    if (!validationResult.success) {
      logger.warn('Authentication failed - Invalid request format', {
        errors: validationResult.error.errors,
      });

      return c.json({
        success: false,
        message: 'Invalid request format',
        errors: validationResult.error.errors,
      }, 400);
    }

    const { username, password }: AuthRequest = validationResult.data;

    // Find user
    const user: User | undefined = config.users.find(u => u.username === username);

    if (!user) {
      logger.warn('Authentication failed - User not found', { username });

      return c.json({
        success: false,
        message: 'Invalid credentials',
      }, 401);
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      logger.warn('Authentication failed - Invalid password', { username });

      return c.json({
        success: false,
        message: 'Invalid credentials',
      }, 401);
    }

    // Generate JWT token
    const tokenPayload = { 
      userId: user.id, 
      username: user.username,
    };
    
    const token: string = jwt.sign(
      tokenPayload, 
      config.jwt.secret,
      {
        expiresIn: '24h',
        issuer: 'k8snode-api',
        subject: user.id,
      }
    );

    logger.info('Authentication successful', { 
      username,
      userId: user.id,
    });

    const response: AuthResponse = {
      success: true,
      message: 'Authentication successful',
      token,
      user: {
        id: user.id,
        username: user.username,
      },
    };

    return c.json(response);

  } catch (error) {
    logger.error('Authentication error', { 
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return c.json({
      success: false,
      message: 'Internal server error',
    }, 500);
  }
});