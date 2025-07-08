const express = require('express');
const { getCachedData } = require('../services/dataService');
const { cacheMiddleware } = require('../middleware/cacheMiddleware');
const { logger } = require('../utils/logger');

const router = express.Router();

router.get('/', cacheMiddleware(300), async (req, res) => {
  try {
    const data = await getCachedData('areas');
    
    res.json({
      success: true,
      data: data || [],
      count: data?.length || 0,
      cached: true,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error fetching areas:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch areas',
      message: error.message
    });
  }
});

router.get('/stats', cacheMiddleware(600), async (req, res) => {
  try {
    const data = await getCachedData('areas');
    
    const statusCounts = {};
    const colorCounts = {};
    
    data.forEach(area => {
      if (area.status) {
        statusCounts[area.status] = (statusCounts[area.status] || 0) + 1;
      }
      if (area.color) {
        colorCounts[area.color] = (colorCounts[area.color] || 0) + 1;
      }
    });
    
    const stats = {
      total: data.length,
      statusDistribution: statusCounts,
      colorDistribution: colorCounts,
      withStatus: data.filter(area => area.status).length,
      withColor: data.filter(area => area.color).length
    };
    
    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error fetching area stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch area stats',
      message: error.message
    });
  }
});

router.get('/:id', cacheMiddleware(300), async (req, res) => {
  try {
    const areaId = parseInt(req.params.id);
    const data = await getCachedData('areas');
    const area = data.find(a => a.id === areaId);
    
    if (!area) {
      return res.status(404).json({
        success: false,
        error: 'Area not found'
      });
    }
    
    res.json({
      success: true,
      data: area,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error fetching area:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch area',
      message: error.message
    });
  }
});

module.exports = router;
