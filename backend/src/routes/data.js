const express = require('express');
const { getCachedData } = require('../services/dataService');
const { cacheMiddleware } = require('../middleware/cacheMiddleware');
const { logger } = require('../utils/logger');

const router = express.Router();

router.get('/all', cacheMiddleware(300), async (req, res) => {
  try {
    const articles = await getCachedData('articles');
    const subscriptions = await getCachedData('subscriptions');
    const areas = await getCachedData('areas');

    res.json({
      success: true,
      data: {
        articles: articles || [],
        subscriptions: subscriptions || [],
        areas: areas || []
      },
      counts: {
        articles: articles?.length || 0,
        subscriptions: subscriptions?.length || 0,
        areas: areas?.length || 0,
        total: (articles?.length || 0) + (subscriptions?.length || 0) + (areas?.length || 0)
      },
      cached: true,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error fetching all data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch all data',
      message: error.message
    });
  }
});

router.get('/summary', cacheMiddleware(600), async (req, res) => {
  try {
    const articles = await getCachedData('articles');
    const subscriptions = await getCachedData('subscriptions');
    const areas = await getCachedData('areas');

    const articleTypes = [...new Set(articles.map(a => a.type))];
    const totalPoints = articles.reduce((sum, a) => sum + (a.points || 0), 0);
    const latestArticle = articles.reduce((latest, current) => 
      new Date(current.publish_at) > new Date(latest.publish_at) ? current : latest, articles[0]
    );

    const summary = {
      counts: {
        articles: articles.length,
        subscriptions: subscriptions.length,
        areas: areas.length,
        articleTypes: articleTypes.length
      },
      articleStats: {
        totalPoints,
        averagePoints: totalPoints / articles.length || 0,
        types: articleTypes,
        latestPublishDate: latestArticle?.publish_at
      },
      subscriptionStats: {
        withColor: subscriptions.filter(s => s.color).length,
        withArea: subscriptions.filter(s => s.area).length
      },
      areaStats: {
        withStatus: areas.filter(a => a.status).length,
        withColor: areas.filter(a => a.color).length
      }
    };

    res.json({
      success: true,
      data: summary,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error fetching data summary:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch data summary',
      message: error.message
    });
  }
});

router.get('/search', cacheMiddleware(60), async (req, res) => {
  try {
    const { q: query, type, limit = 50 } = req.query;
    
    if (!query || query.trim().length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Query parameter "q" must be at least 2 characters long'
      });
    }

    const searchLimit = Math.min(parseInt(limit), 100);
    const searchQuery = query.toLowerCase().trim();
    const results = { articles: [], subscriptions: [], areas: [] };

    if (!type || type === 'articles') {
      const articles = await getCachedData('articles');
      results.articles = articles
        .filter(article => 
          article.title.toLowerCase().includes(searchQuery) ||
          (article.content && article.content.toLowerCase().includes(searchQuery)) ||
          article.type.toLowerCase().includes(searchQuery)
        )
        .slice(0, searchLimit);
    }

    if (!type || type === 'subscriptions') {
      const subscriptions = await getCachedData('subscriptions');
      results.subscriptions = subscriptions
        .filter(sub => 
          sub.name.toLowerCase().includes(searchQuery) ||
          (sub.area && sub.area.toLowerCase().includes(searchQuery))
        )
        .slice(0, searchLimit);
    }

    if (!type || type === 'areas') {
      const areas = await getCachedData('areas');
      results.areas = areas
        .filter(area => 
          area.name.toLowerCase().includes(searchQuery) ||
          (area.status && area.status.toLowerCase().includes(searchQuery))
        )
        .slice(0, searchLimit);
    }

    const totalResults = results.articles.length + results.subscriptions.length + results.areas.length;

    res.json({
      success: true,
      data: results,
      meta: {
        query: query.trim(),
        type: type || 'all',
        totalResults,
        counts: {
          articles: results.articles.length,
          subscriptions: results.subscriptions.length,
          areas: results.areas.length
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error performing search:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to perform search',
      message: error.message
    });
  }
});

module.exports = router;
