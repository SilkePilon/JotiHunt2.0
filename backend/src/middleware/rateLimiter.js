const rateLimit = require('express-rate-limit');
const { logger } = require('../utils/logger');

const createRateLimiter = (windowMs = 15 * 60 * 1000, maxRequests = 100, message = 'Too many requests') => {
  return rateLimit({
    windowMs,
    max: maxRequests,
    message: {
      success: false,
      error: message,
      retryAfter: Math.ceil(windowMs / 1000)
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      logger.warn(`Rate limit exceeded for IP: ${req.ip}, User-Agent: ${req.get('User-Agent')}`);
      res.status(429).json({
        success: false,
        error: message,
        retryAfter: Math.ceil(windowMs / 1000)
      });
    }
  });
};

const generalLimiter = createRateLimiter(15 * 60 * 1000, 100, 'Too many requests from this IP, please try again later');
const authLimiter = createRateLimiter(15 * 60 * 1000, 10, 'Too many authentication attempts, please try again later');
const refreshLimiter = createRateLimiter(5 * 60 * 1000, 5, 'Too many refresh requests, please wait before trying again');

module.exports = {
  generalLimiter,
  authLimiter,
  refreshLimiter,
  createRateLimiter
};
