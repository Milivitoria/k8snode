import { Hono } from 'hono';
import { HealthResponse } from '../types';
import { config } from '../config';
import { logger } from '../utils/logger';

const health = new Hono();

health.get('/', (c) => {
  const startTime = process.hrtime();
  
  try {
    const memoryUsage = process.memoryUsage();
    const uptimeSeconds = Math.floor(process.uptime());
    
    // Calculate memory usage in MB
    const memoryUsedMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);
    const memoryTotalMB = Math.round(memoryUsage.heapTotal / 1024 / 1024);
    const memoryPercentage = Math.round((memoryUsedMB / memoryTotalMB) * 100);

    const healthResponse: HealthResponse = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      environment: config.environment,
      uptime: uptimeSeconds,
      memory: {
        used: memoryUsedMB,
        total: memoryTotalMB,
        percentage: memoryPercentage
      }
    };

    const endTime = process.hrtime(startTime);
    const responseTimeMs = (endTime[0] * 1000) + (endTime[1] / 1000000);

    logger.http('Health check requested', {
      responseTime: `${responseTimeMs.toFixed(2)}ms`,
      memoryUsage: `${memoryUsedMB}MB`,
      uptime: `${uptimeSeconds}s`
    });

    return c.json(healthResponse);
  } catch (error) {
    logger.error('Health check failed', { error: error instanceof Error ? error.message : String(error) });
    
    return c.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      message: 'Health check failed'
    }, 500);
  }
});

export default health;