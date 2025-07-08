const express = require('express');
const { getCachedData } = require('../services/dataService');
const { cacheMiddleware } = require('../middleware/cacheMiddleware');
const { logger } = require('../utils/logger');

const router = express.Router();

router.get('/', cacheMiddleware(300), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);
    const type = req.query.type;
    const search = req.query.search;
    
    let data = await getCachedData('articles');
    
    if (type) {
      data = data.filter(article => article.type.toLowerCase() === type.toLowerCase());
    }
    
    if (search) {
      const searchLower = search.toLowerCase();
      data = data.filter(article => 
        article.title.toLowerCase().includes(searchLower) ||
        (article.content && article.content.toLowerCase().includes(searchLower))
      );
    }
    
    const totalItems = data.length;
    const totalPages = Math.ceil(totalItems / limit);
    const offset = (page - 1) * limit;
    const paginatedData = data.slice(offset, offset + limit);
    
    res.json({
      success: true,
      data: paginatedData,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
      },
      filters: {
        type,
        search
      },
      cached: true,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error fetching articles:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch articles',
      message: error.message
    });
  }
});

router.get('/types', cacheMiddleware(600), async (req, res) => {
  try {
    const data = await getCachedData('articles');
    const types = [...new Set(data.map(article => article.type))];
    
    const typeStats = types.map(type => {
      const articles = data.filter(article => article.type === type);
      return {
        type,
        count: articles.length,
        latestPublishDate: Math.max(...articles.map(a => new Date(a.publish_at).getTime())),
        averagePoints: articles.reduce((sum, a) => sum + (a.points || 0), 0) / articles.length || 0
      };
    });
    
    res.json({
      success: true,
      data: typeStats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error fetching article types:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch article types',
      message: error.message
    });
  }
});

router.get('/:id', cacheMiddleware(300), async (req, res) => {
  try {
    const articleId = parseInt(req.params.id);
    const data = await getCachedData('articles');
    const article = data.find(a => a.id === articleId);
    
    if (!article) {
      return res.status(404).json({
        success: false,
        error: 'Article not found'
      });
    }
    
    res.json({
      success: true,
      data: article,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error fetching article:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch article',
      message: error.message
    });
  }
});

module.exports = router;
