const express = require('express');
const { getDatabaseStats } = require('../services/sqliteService');
const { getCacheStats } = require('../middleware/cacheMiddleware');
const { logger } = require('../utils/logger');

const router = express.Router();

router.get('/', async (req, res) => {
  const healthCheck = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  };

  try {
    const dbStats = await getDatabaseStats();
    const cacheStats = getCacheStats();
    
    healthCheck.services = {
      database: {
        status: 'healthy',
        stats: dbStats
      },
      cache: {
        status: 'healthy',
        stats: cacheStats
      }
    };

    healthCheck.system = {
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      platform: process.platform,
      nodeVersion: process.version
    };

    res.status(200).json(healthCheck);
  } catch (error) {
    logger.error('Health check failed:', error);
    healthCheck.status = 'unhealthy';
    healthCheck.error = error.message;
    res.status(503).json(healthCheck);
  }
});

router.get('/ping', (req, res) => {
  res.status(200).json({
    message: 'pong',
    timestamp: new Date().toISOString()
  });
});

router.get('/ready', async (req, res) => {
  try {
    await getDatabaseStats();
    res.status(200).json({
      status: 'ready',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      status: 'not ready',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;
