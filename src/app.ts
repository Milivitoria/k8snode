import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { prettyJSON } from 'hono/pretty-json';
import { secureHeaders } from 'hono/secure-headers';
import { config, validateEnvironment } from './config';
import { logger } from './utils/logger';
import { health } from './routes/health';
import { auth } from './routes/auth';
import { ErrorResponse } from './types';
import { randomUUID } from 'crypto';

// Create Hono app with proper typing
type Variables = {
  requestId: string;
};

const app = new Hono<{ Variables: Variables }>();

// Validate environment variables
validateEnvironment();

// Security headers
app.use('*', secureHeaders());

// CORS configuration
app.use('*', cors({
  origin: process.env['CORS_ORIGIN'] ? process.env['CORS_ORIGIN'].split(',') : ['*'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
}));

// Request ID middleware
app.use('*', async (c, next) => {
  const requestId = randomUUID();
  c.set('requestId', requestId);
  c.header('X-Request-ID', requestId);
  await next();
});

// Request logging middleware
app.use('*', async (c, next) => {
  const startTime = Date.now();
  const requestId = c.get('requestId');
  
  await next();
  
  const responseTime = Date.now() - startTime;
  logger.logRequest(
    c.req.method,
    c.req.path,
    c.res.status,
    responseTime,
    requestId
  );
});

// Pretty JSON for development
if (config.nodeEnv === 'development') {
  app.use('*', prettyJSON());
}

// Routes
app.route('/health', health);
app.route('/auth', auth);

// Root endpoint
app.get('/', (c) => {
  return c.json({
    message: 'K8sNode API is running',
    version: '1.0.0',
    environment: config.nodeEnv,
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.notFound((c) => {
  const errorResponse: ErrorResponse = {
    success: false,
    message: 'Endpoint not found',
  };
  
  logger.warn('Endpoint not found', {
    method: c.req.method,
    path: c.req.path,
  }, c.get('requestId'));

  return c.json(errorResponse, 404);
});

// Global error handler
app.onError((err, c) => {
  const requestId = c.get('requestId');
  logger.logError(err, 'Unhandled error', requestId);

  const errorResponse: ErrorResponse = {
    success: false,
    message: 'Internal server error',
  };

  return c.json(errorResponse, 500);
});

// Graceful shutdown handling
const gracefulShutdown = () => {
  logger.info('Received shutdown signal, closing server gracefully...');
  process.exit(0);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Start server (only if this file is run directly)
if (require.main === module) {
  const { serve } = require('@hono/node-server');
  
  serve({
    fetch: app.fetch,
    port: config.port,
  });

  logger.info('Server started successfully', {
    port: config.port,
    environment: config.nodeEnv,
    pid: process.pid,
  });
}

export default app;