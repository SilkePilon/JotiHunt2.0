const express = require('express');
const { getCachedData } = require('../services/dataService');
const { cacheMiddleware } = require('../middleware/cacheMiddleware');
const { logger } = require('../utils/logger');

const router = express.Router();

router.get('/', cacheMiddleware(300), async (req, res) => {
  try {
    const data = await getCachedData('subscriptions');
    
    res.json({
      success: true,
      data: data || [],
      count: data?.length || 0,
      cached: true,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error fetching subscriptions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch subscriptions',
      message: error.message
    });
  }
});

router.get('/stats', cacheMiddleware(600), async (req, res) => {
  try {
    const data = await getCachedData('subscriptions');
    
    const stats = {
      total: data.length,
      withColor: data.filter(sub => sub.color).length,
      withArea: data.filter(sub => sub.area).length,
      colors: [...new Set(data.map(sub => sub.color).filter(Boolean))],
      areas: [...new Set(data.map(sub => sub.area).filter(Boolean))]
    };
    
    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error fetching subscription stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch subscription stats',
      message: error.message
    });
  }
});

router.get('/:id', cacheMiddleware(300), async (req, res) => {
  try {
    const subscriptionId = parseInt(req.params.id);
    const data = await getCachedData('subscriptions');
    const subscription = data.find(s => s.id === subscriptionId);
    
    if (!subscription) {
      return res.status(404).json({
        success: false,
        error: 'Subscription not found'
      });
    }
    
    res.json({
      success: true,
      data: subscription,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error fetching subscription:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch subscription',
      message: error.message
    });
  }
});

module.exports = router;
