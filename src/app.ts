import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';
import { config } from './config';
import { logger as customLogger } from './utils/logger';
import { healthRoute } from './routes/health';
import { authRoute } from './routes/auth';

const app = new Hono();

// Middleware
app.use('*', cors({
  origin: ['http://localhost:3000', 'http://localhost:8080', 'https://*.amazonaws.com'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

app.use('*', logger());
app.use('*', prettyJSON());

// Global error handler
app.onError((err, c) => {
  customLogger.error('Global error handler', {
    error: err.message,
    stack: err.stack,
    path: c.req.path,
    method: c.req.method,
  });

  return c.json({
    error: 'Internal Server Error',
    message: 'Something went wrong',
    timestamp: new Date().toISOString(),
  }, 500);
});

// Routes
app.route('/health', healthRoute);
app.route('/auth', authRoute);

// Root endpoint
app.get('/', (c) => {
  return c.json({
    message: 'K8s Node API is running',
    version: config.version,
    environment: config.environment,
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/health',
      auth: '/auth',
    },
  });
});

// 404 handler
app.notFound((c) => {
  customLogger.warn('Not found', {
    path: c.req.path,
    method: c.req.method,
  });

  return c.json({
    error: 'Not Found',
    message: 'The requested resource was not found',
    timestamp: new Date().toISOString(),
  }, 404);
});

// Graceful shutdown handling
const gracefulShutdown = () => {
  customLogger.info('Shutting down gracefully...');
  process.exit(0);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Start server
const startServer = () => {
  try {
    customLogger.info('Starting K8s Node API', {
      port: config.port,
      environment: config.environment,
      version: config.version,
    });

    serve({
      fetch: app.fetch,
      port: config.port,
    });

    customLogger.info('Server started successfully', {
      port: config.port,
      environment: config.environment,
    });

  } catch (error) {
    customLogger.error('Failed to start server', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    process.exit(1);
  }
};

// Start the server if this file is run directly
if (require.main === module) {
  startServer();
}

export default app;