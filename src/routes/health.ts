import { Hono } from 'hono';
import { HealthResponse } from '../types';
import { config } from '../config';
import { logger } from '../utils/logger';

export const healthRoute = new Hono();

healthRoute.get('/', (c) => {
  try {
    const memoryUsage = process.memoryUsage();
    const uptime = process.uptime();
    
    // Convert bytes to MB
    const memoryUsedMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);
    const memoryTotalMB = Math.round(memoryUsage.heapTotal / 1024 / 1024);
    const memoryPercentage = Math.round((memoryUsedMB / memoryTotalMB) * 100);

    const healthData: HealthResponse = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: config.version,
      environment: config.environment,
      uptime: Math.round(uptime),
      memory: {
        used: memoryUsedMB,
        total: memoryTotalMB,
        percentage: memoryPercentage,
      },
    };

    logger.info('Health check requested', { 
      uptime: healthData.uptime,
      memory: healthData.memory,
    });

    return c.json(healthData);
  } catch (error) {
    logger.error('Health check failed', { error: error instanceof Error ? error.message : 'Unknown error' });
    
    return c.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      message: 'Health check failed',
    }, 500);
  }
});