import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';
import { serve } from '@hono/node-server';
import { config } from './config';
import { logger as customLogger } from './utils/logger';
import healthRoutes from './routes/health';
import authRoutes from './routes/auth';

// Create Hono app instance
const app = new Hono();

// Middleware setup
app.use('*', cors({
  origin: config.corsOrigins,
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  exposeHeaders: ['Content-Length'],
  maxAge: 86400,
  credentials: true
}));

app.use('*', logger());
app.use('*', prettyJSON());
// Timeout middleware (removed for now as it may not be available in this version)

// Error handling middleware
app.onError((err, c) => {
  customLogger.error('Unhandled error occurred', {
    error: err.message,
    stack: err.stack,
    path: c.req.path,
    method: c.req.method
  });
  
  return c.json({
    success: false,
    message: 'Internal server error',
    timestamp: new Date().toISOString()
  }, 500);
});

// Request logging middleware
app.use('*', async (c, next) => {
  const start = Date.now();
  await next();
  const end = Date.now();
  
  customLogger.http('Request processed', {
    method: c.req.method,
    path: c.req.path,
    status: c.res.status,
    responseTime: `${end - start}ms`,
    userAgent: c.req.header('user-agent') || 'unknown'
  });
});

// Routes
app.route('/health', healthRoutes);
app.route('/auth', authRoutes);

// Root endpoint
app.get('/', (c) => {
  return c.json({
    message: 'K8sNode API is running',
    version: '1.0.0',
    environment: config.environment,
    timestamp: new Date().toISOString(),
    endpoints: [
      'GET /health - Health check endpoint',
      'POST /auth - Authentication endpoint'
    ]
  });
});

// 404 handler
app.notFound((c) => {
  customLogger.warn('Route not found', {
    path: c.req.path,
    method: c.req.method
  });
  
  return c.json({
    success: false,
    message: 'Route not found',
    timestamp: new Date().toISOString()
  }, 404);
});

// Graceful shutdown handling
const gracefulShutdown = () => {
  customLogger.info('Graceful shutdown initiated');
  process.exit(0);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Start server function
const startServer = () => {
  try {
    customLogger.info('Starting K8sNode API server', {
      port: config.port,
      environment: config.environment,
      nodeVersion: process.version
    });

    serve({
      fetch: app.fetch,
      port: config.port,
    });

    customLogger.info('K8sNode API server started successfully', {
      port: config.port,
      environment: config.environment
    });
  } catch (error) {
    customLogger.error('Failed to start server', {
      error: error instanceof Error ? error.message : String(error)
    });
    process.exit(1);
  }
};

// Only start server if this file is run directly
if (require.main === module) {
  startServer();
}

export default app;