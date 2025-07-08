const axios = require('axios');
const { logger } = require('../utils/logger');
const { 
  upsertArticles,
  upsertSubscriptions,
  upsertAreas,
  getArticlesWithAssignments,
  getSubscriptions,
  getAreas,
  updateMetadata,
  getMetadata,
  getDatabaseStats,
  storeResponseTime,
  getResponseTimes,
  getResponseTimeStats,
  cleanOldResponseTimes
} = require('./sqliteService');

const JOTIHUNT_API_BASE = process.env.JOTIHUNT_API_BASE || 'https://jotihunt.nl/api/2.0';

// API endpoints to fetch from
const endpoints = {
  articles: `${JOTIHUNT_API_BASE}/articles`,
  subscriptions: `${JOTIHUNT_API_BASE}/subscriptions`,
  areas: `${JOTIHUNT_API_BASE}/areas`
};

/**
 * Fetch data from a JotiHunt API endpoint
 */
async function fetchFromEndpoint(url, timeout = 10000) {
  const startTime = Date.now();
  let endpointName = 'unknown';
  
  try {
    // Extract endpoint name from URL
    if (url.includes('/articles')) endpointName = 'articles';
    else if (url.includes('/subscriptions')) endpointName = 'subscriptions';
    else if (url.includes('/areas')) endpointName = 'areas';
    
    const response = await axios.get(url, {
      timeout,
      headers: {
        'User-Agent': 'JotiHunt-Backend/1.0.0',
        'Accept': 'application/json'
      }
    });

    const responseTime = Date.now() - startTime;
    
    if (response.status === 200) {
      // Store successful response time
      await storeResponseTime(endpointName, responseTime, response.status, true);
      return response.data;
    } else {
      // Store failed response time
      await storeResponseTime(endpointName, responseTime, response.status, false, `HTTP ${response.status}: ${response.statusText}`);
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  } catch (error) {
    const responseTime = Date.now() - startTime;
    let errorMessage = error.message;
    let statusCode = null;
    
    if (error.code === 'ECONNABORTED') {
      errorMessage = `Request timeout for ${url}`;
    } else if (error.response) {
      statusCode = error.response.status;
      errorMessage = `HTTP ${error.response.status}: ${error.response.statusText}`;
    } else if (error.request) {
      errorMessage = `Network error for ${url}`;
    }
    
    // Store failed response time
    await storeResponseTime(endpointName, responseTime, statusCode, false, errorMessage);
    
    throw new Error(errorMessage);
  }
}

/**
 * Fetch and store all data from JotiHunt API endpoints
 */
async function fetchAndCacheData() {
  const startTime = Date.now();
  logger.info('Starting data fetch from JotiHunt API...');

  const results = {};
  const errors = {};

  // Fetch data from all endpoints in parallel
  await Promise.allSettled([
    fetchFromEndpoint(endpoints.articles).then(async (data) => {
      results.articles = data;
      await upsertArticles(data.data || data);
      logger.info(`✅ Articles fetched and stored: ${data?.data?.length || 0} items`);
    }).catch(error => {
      errors.articles = error.message;
      logger.error(`❌ Articles fetch failed: ${error.message}`);
    }),

    fetchFromEndpoint(endpoints.subscriptions).then(async (data) => {
      results.subscriptions = data;
      await upsertSubscriptions(data.data || data);
      logger.info(`✅ Subscriptions fetched and stored: ${data?.data?.length || 0} items`);
    }).catch(error => {
      errors.subscriptions = error.message;
      logger.error(`❌ Subscriptions fetch failed: ${error.message}`);
    }),

    fetchFromEndpoint(endpoints.areas).then(async (data) => {
      results.areas = data;
      await upsertAreas(data.data || data);
      logger.info(`✅ Areas fetched and stored: ${data?.data?.length || 0} items`);
    }).catch(error => {
      errors.areas = error.message;
      logger.error(`❌ Areas fetch failed: ${error.message}`);
    })
  ]);

  // Update metadata
  try {
    await updateMetadata('lastUpdate', new Date().toISOString());
    await updateMetadata('successfulEndpoints', Object.keys(results));
    await updateMetadata('failedEndpoints', Object.keys(errors));
    await updateMetadata('lastFetchDuration', Date.now() - startTime);
    await updateMetadata('version', '1.0.0');
    
    // Clean old response times (keep only last 7 days)
    await cleanOldResponseTimes();
  } catch (error) {
    logger.error('Failed to update metadata:', error);
  }

  const duration = Date.now() - startTime;
  const successCount = Object.keys(results).length;
  const errorCount = Object.keys(errors).length;

  logger.info(`📊 Data fetch completed in ${duration}ms`);
  logger.info(`✅ Successful: ${successCount} endpoints`);
  
  if (errorCount > 0) {
    logger.warn(`❌ Failed: ${errorCount} endpoints`);
    logger.warn('Errors:', errors);
  }

  return {
    success: successCount > 0,
    results,
    errors,
    duration,
    timestamp: new Date().toISOString()
  };
}

/**
 * Get cached data for a specific endpoint from database
 */
async function getCachedData(endpoint) {
  try {
    let data;
    
    switch (endpoint) {
      case 'articles':
        data = await getArticlesWithAssignments();
        break;
      case 'subscriptions':
        data = await getSubscriptions();
        break;
      case 'areas':
        data = await getAreas();
        break;
      default:
        logger.warn(`Unknown endpoint: ${endpoint}`);
        return [];
    }
    
    if (!data || data.length === 0) {
      logger.warn(`No data available in database for endpoint: ${endpoint}`);
      return [];
    }

    logger.info(`Serving data from database for: ${endpoint} (${data.length} records)`);
    return data;
  } catch (error) {
    logger.error(`Error getting cached data for ${endpoint}:`, error);
    return [];
  }
}

/**
 * Get database status and metadata
 */
async function getCacheStatus() {
  try {
    const stats = await getDatabaseStats();
    const metadata = await getMetadata();
    
    return {
      lastUpdate: metadata.lastUpdate,
      version: metadata.version,
      successfulEndpoints: metadata.successfulEndpoints || [],
      failedEndpoints: metadata.failedEndpoints || [],
      lastFetchDuration: metadata.lastFetchDuration,
      ...stats
    };
  } catch (error) {
    logger.error('Error getting cache status:', error);
    return null;
  }
}

/**
 * Get API response times
 */
async function getApiResponseTimes(limit = 100) {
  try {
    const responseTimes = await getResponseTimes(limit);
    return responseTimes;
  } catch (error) {
    logger.error('Error getting API response times:', error);
    return [];
  }
}

/**
 * Get API response time statistics
 */
async function getApiResponseTimeStats() {
  try {
    const stats = await getResponseTimeStats();
    return stats;
  } catch (error) {
    logger.error('Error getting API response time stats:', error);
    return [];
  }
}

module.exports = {
  fetchAndCacheData,
  getCachedData,
  getCacheStatus,
  fetchFromEndpoint,
  getApiResponseTimes,
  getApiResponseTimeStats
};
