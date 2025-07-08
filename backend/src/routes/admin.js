const express = require('express');
const { fetchAndCacheData, getCacheStatus, getApiResponseTimes, getApiResponseTimeStats } = require('../services/dataService');
const { clearCache, getCacheStats } = require('../middleware/cacheMiddleware');
const { refreshLimiter } = require('../middleware/rateLimiter');
const { logger } = require('../utils/logger');

const router = express.Router();

router.get('/status', async (req, res) => {
  try {
    const status = await getCacheStatus();
    const cacheStats = getCacheStats();
    
    res.json({
      success: true,
      status: 'operational',
      data: {
        ...status,
        cache: cacheStats,
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        version: '1.0.0'
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error getting status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get status',
      message: error.message
    });
  }
});

router.post('/refresh', refreshLimiter, async (req, res) => {
  try {
    logger.info(`Manual refresh triggered by IP: ${req.ip}`);
    
    const result = await fetchAndCacheData();
    
    clearCache();
    
    res.json({
      success: true,
      message: 'Data refreshed successfully',
      data: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error refreshing data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to refresh data',
      message: error.message
    });
  }
});

router.get('/response-times', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 100, 1000);
    const responseTimes = await getApiResponseTimes(limit);
    
    res.json({
      success: true,
      data: responseTimes,
      count: responseTimes.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error fetching response times:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch response times',
      message: error.message
    });
  }
});

router.get('/response-stats', async (req, res) => {
  try {
    const stats = await getApiResponseTimeStats();
    
    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error fetching response time stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch response time stats',
      message: error.message
    });
  }
});

router.post('/cache/clear', async (req, res) => {
  try {
    const { pattern } = req.body;
    clearCache(pattern);
    
    logger.info(`Cache cleared${pattern ? ` for pattern: ${pattern}` : ''} by IP: ${req.ip}`);
    
    res.json({
      success: true,
      message: `Cache cleared${pattern ? ` for pattern: ${pattern}` : ''}`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error clearing cache:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear cache',
      message: error.message
    });
  }
});

router.get('/cache/stats', async (req, res) => {
  try {
    const stats = getCacheStats();
    
    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error getting cache stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get cache stats',
      message: error.message
    });
  }
});

module.exports = router;
