import { Hono } from 'hono';
import { z } from 'zod';
import { sign } from 'jsonwebtoken';
import { AuthRequest, AuthResponse, ErrorResponse } from '../types';
import { config, findUserByUsername, verifyPassword } from '../config';
import { logger } from '../utils/logger';

type Variables = {
  requestId: string;
};

const auth = new Hono<{ Variables: Variables }>();

// Zod schema for request validation
const AuthRequestSchema = z.object({
  username: z.string().min(1, 'Username is required').max(50, 'Username too long'),
  password: z.string().min(1, 'Password is required').max(100, 'Password too long'),
});

auth.post('/', async (c) => {
  const startTime = Date.now();
  const requestId = c.get('requestId') || 'unknown';
  const clientIp = c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown';
  const userAgent = c.req.header('user-agent') || 'unknown';

  try {
    // Parse and validate request body
    const body = await c.req.json();
    const validationResult = AuthRequestSchema.safeParse(body);

    if (!validationResult.success) {
      const errorResponse: ErrorResponse = {
        success: false,
        message: 'Invalid request data',
        details: validationResult.error.flatten().fieldErrors,
      };

      logger.logAuth('unknown', false, clientIp, userAgent, requestId);
      return c.json(errorResponse, 400);
    }

    const { username, password }: AuthRequest = validationResult.data;

    // Find user
    const user = findUserByUsername(username);
    if (!user) {
      const errorResponse: ErrorResponse = {
        success: false,
        message: 'Invalid credentials',
      };

      logger.logAuth(username, false, clientIp, userAgent, requestId);
      return c.json(errorResponse, 401);
    }

    // Verify password
    const isPasswordValid = await verifyPassword(password, user.password);
    if (!isPasswordValid) {
      const errorResponse: ErrorResponse = {
        success: false,
        message: 'Invalid credentials',
      };

      logger.logAuth(username, false, clientIp, userAgent, requestId);
      return c.json(errorResponse, 401);
    }

    // Generate JWT token
    const token = sign(
      { 
        userId: user.id, 
        username: user.username,
      },
      config.jwtSecret
    );

    const response: AuthResponse = {
      success: true,
      message: 'Authentication successful',
      token,
      user: {
        id: user.id,
        username: user.username,
      },
    };

    const responseTime = Date.now() - startTime;
    logger.logAuth(username, true, clientIp, userAgent, requestId);
    logger.info('Authentication successful', {
      userId: user.id,
      username: user.username,
      responseTime,
    }, requestId, user.id);

    return c.json(response, 200);

  } catch (error) {
    logger.logError(error as Error, 'Authentication error', requestId);

    const errorResponse: ErrorResponse = {
      success: false,
      message: 'Internal server error',
    };

    return c.json(errorResponse, 500);
  }
});

export { auth };