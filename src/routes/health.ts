import { Hono } from 'hono';
import { HealthResponse } from '../types';
import { logger } from '../utils/logger';

type Variables = {
  requestId: string;
};

const health = new Hono<{ Variables: Variables }>();

health.get('/', async (c) => {
  const startTime = Date.now();
  const requestId = c.get('requestId') || 'unknown';

  try {
    // Get memory usage
    const memUsage = process.memoryUsage();
    const memUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
    const memTotalMB = Math.round(memUsage.heapTotal / 1024 / 1024);
    const memPercentage = Math.round((memUsedMB / memTotalMB) * 100);

    // Get uptime in seconds
    const uptime = Math.floor(process.uptime());

    // Get version from package.json
    const version = process.env['npm_package_version'] || '1.0.0';

    // Get environment
    const environment = process.env['NODE_ENV'] || 'development';

    const response: HealthResponse = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version,
      environment,
      uptime,
      memory: {
        used: memUsedMB,
        total: memTotalMB,
        percentage: memPercentage,
      },
    };

    const responseTime = Date.now() - startTime;
    logger.logHealthCheck('ok', responseTime, requestId);

    return c.json(response, 200);
  } catch (error) {
    const responseTime = Date.now() - startTime;
    logger.logError(error as Error, 'Health check failed', requestId);
    logger.logHealthCheck('error', responseTime, requestId);

    return c.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      message: 'Health check failed',
    }, 500);
  }
});

export { health };