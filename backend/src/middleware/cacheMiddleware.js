const NodeCache = require('node-cache');
const { logger } = require('../utils/logger');

const cache = new NodeCache({ 
  stdTTL: 300,
  checkperiod: 60,
  useClones: false
});

const cacheMiddleware = (ttl = 300) => {
  return (req, res, next) => {
    if (req.method !== 'GET') {
      return next();
    }

    const key = `${req.originalUrl || req.url}`;
    const cachedResponse = cache.get(key);

    if (cachedResponse) {
      logger.debug(`Cache hit for ${key}`);
      res.setHeader('X-Cache', 'HIT');
      res.setHeader('X-Cache-TTL', cache.getTtl(key) - Date.now());
      return res.json(cachedResponse);
    }

    res.setHeader('X-Cache', 'MISS');
    const originalJson = res.json;
    
    res.json = function(data) {
      if (res.statusCode === 200 && data.success !== false) {
        cache.set(key, data, ttl);
        logger.debug(`Cached response for ${key} with TTL ${ttl}s`);
      }
      originalJson.call(this, data);
    };

    next();
  };
};

const clearCache = (pattern = null) => {
  if (pattern) {
    const keys = cache.keys().filter(key => key.includes(pattern));
    cache.del(keys);
    logger.info(`Cleared ${keys.length} cache entries matching pattern: ${pattern}`);
  } else {
    cache.flushAll();
    logger.info('Cleared all cache entries');
  }
};

const getCacheStats = () => {
  return {
    keys: cache.keys().length,
    hits: cache.getStats().hits,
    misses: cache.getStats().misses,
    hitRate: cache.getStats().hits / (cache.getStats().hits + cache.getStats().misses) || 0
  };
};

module.exports = {
  cacheMiddleware,
  clearCache,
  getCacheStats,
  cache
};
