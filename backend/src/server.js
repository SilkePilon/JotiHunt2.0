const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const cron = require('node-cron');

const { fetchAndCacheData } = require('./services/dataService');
const { initializeDatabase } = require('./services/sqliteService');
const { logger } = require('./utils/logger');

const { requestLogger, validateJsonContentType } = require('./middleware/requestMiddleware');
const { generalLimiter } = require('./middleware/rateLimiter');

const healthRoutes = require('./routes/health');
const articlesRoutes = require('./routes/articles');
const subscriptionsRoutes = require('./routes/subscriptions');
const areasRoutes = require('./routes/areas');
const assignmentsRoutes = require('./routes/assignments');
const adminRoutes = require('./routes/admin');
const dataRoutes = require('./routes/data');

const app = express();
const PORT = process.env.PORT || 3001;
const API_VERSION = 'v1';

app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(compression());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization', 'Cache-Control'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use(requestLogger);
app.use(validateJsonContentType);
app.use(generalLimiter);

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'JotiHunt Backend API',
    version: '1.0.0',
    documentation: {
      health: '/health',
      api: {
        articles: `/api/${API_VERSION}/articles`,
        subscriptions: `/api/${API_VERSION}/subscriptions`,
        areas: `/api/${API_VERSION}/areas`,
        assignments: `/api/${API_VERSION}/assignments`,
        data: `/api/${API_VERSION}/data`,
        admin: `/api/${API_VERSION}/admin`
      }
    },
    timestamp: new Date().toISOString()
  });
});

app.use('/health', healthRoutes);
app.use(`/api/${API_VERSION}/articles`, articlesRoutes);
app.use(`/api/${API_VERSION}/subscriptions`, subscriptionsRoutes);
app.use(`/api/${API_VERSION}/areas`, areasRoutes);
app.use(`/api/${API_VERSION}/assignments`, assignmentsRoutes);
app.use(`/api/${API_VERSION}/admin`, adminRoutes);
app.use(`/api/${API_VERSION}/data`, dataRoutes);

app.use('/api/articles', articlesRoutes);
app.use('/api/subscriptions', subscriptionsRoutes);
app.use('/api/areas', areasRoutes);
app.use('/api/assignments', assignmentsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/data', dataRoutes);

app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    availableEndpoints: {
      health: '/health',
      api: {
        articles: `/api/${API_VERSION}/articles`,
        subscriptions: `/api/${API_VERSION}/subscriptions`,
        areas: `/api/${API_VERSION}/areas`,
        assignments: `/api/${API_VERSION}/assignments`,
        data: `/api/${API_VERSION}/data`,
        admin: `/api/${API_VERSION}/admin`
      }
    },
    timestamp: new Date().toISOString()
  });
});

app.use((error, req, res, next) => {
  logger.error('Unhandled error:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong',
    timestamp: new Date().toISOString()
  });
});

const gracefulShutdown = (signal) => {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);
  process.exit(0);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

initializeDatabase()
  .then(() => {
    logger.info('Database initialized, starting initial data fetch...');
    return fetchAndCacheData();
  })
  .then(() => logger.info('Initial data fetch completed'))
  .catch(error => logger.error('Initialization failed:', error));

cron.schedule('*/5 * * * *', async () => {
  logger.info('Starting scheduled data refresh...');
  try {
    await fetchAndCacheData();
    logger.info('Scheduled data refresh completed');
  } catch (error) {
    logger.error('Scheduled data refresh failed:', error);
  }
});

app.listen(PORT, '0.0.0.0', () => {
  logger.info(`🚀 JotiHunt Backend API running on port ${PORT}`);
  logger.info(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`📊 Health check available at: http://localhost:${PORT}/health`);
  logger.info(`📖 API Documentation at: http://localhost:${PORT}/`);
});

module.exports = app;
