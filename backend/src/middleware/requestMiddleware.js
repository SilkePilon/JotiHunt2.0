const { logger } = require('../utils/logger');

const requestLogger = (req, res, next) => {
  const startTime = Date.now();
  const originalSend = res.send;
  
  res.send = function(data) {
    const duration = Date.now() - startTime;
    logger.info(`${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms - ${req.ip} - ${req.get('User-Agent') || 'Unknown'}`);
    originalSend.call(this, data);
  };
  
  next();
};

const validateJsonContentType = (req, res, next) => {
  if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
    if (!req.is('application/json')) {
      return res.status(400).json({
        success: false,
        error: 'Content-Type must be application/json'
      });
    }
  }
  next();
};

const corsHeaders = (req, res, next) => {
  res.header('Access-Control-Allow-Origin', process.env.CORS_ORIGIN || '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS,PATCH');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control');
  res.header('Access-Control-Max-Age', '86400');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
};

module.exports = {
  requestLogger,
  validateJsonContentType,
  corsHeaders
};
