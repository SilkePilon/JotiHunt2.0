# JotiHunt Backend API v1.0 - Advanced Modular Structure

## 🏗️ Architecture Overview

The API has been restructured into a modular, scalable architecture with the following improvements:

### 📁 Directory Structure
```
backend/src/
├── middleware/
│   ├── rateLimiter.js      # Rate limiting for different endpoints
│   ├── requestMiddleware.js # Request logging, validation, CORS
│   └── cacheMiddleware.js   # In-memory caching with TTL
├── routes/
│   ├── health.js           # Health checks and system status
│   ├── articles.js         # Article endpoints with pagination & filtering
│   ├── subscriptions.js    # Subscription management
│   ├── areas.js            # Area management with statistics
│   ├── assignments.js      # Assignment tracking and management
│   ├── admin.js            # Administrative endpoints
│   └── data.js             # Data aggregation and search
├── services/
│   ├── dataService.js      # Enhanced with response time tracking
│   └── sqliteService.js    # Database operations with response time storage
└── server.js               # Main application with route mounting
```

## 🚀 New Features Added

### 1. **Response Time Tracking**
- Automatically tracks API response times for all JotiHunt API calls
- Stores response times, status codes, and error messages in SQLite
- Provides statistics and historical data
- Endpoints: `/api/v1/admin/response-times`, `/api/v1/admin/response-stats`

### 2. **Advanced Caching System**
- In-memory caching with configurable TTL
- Cache statistics and management
- Selective cache clearing by pattern
- Cache hit/miss tracking
- Endpoints: `/api/v1/admin/cache/stats`, `/api/v1/admin/cache/clear`

### 3. **Rate Limiting**
- Different rate limits for different endpoint types
- General API: 100 requests per 15 minutes
- Admin endpoints: 10 requests per 15 minutes  
- Refresh endpoint: 5 requests per 5 minutes
- IP-based tracking with detailed logging

### 4. **Enhanced Search & Filtering**
- Global search across all data types
- Type-specific filtering
- Pagination support
- Query parameter validation
- Endpoint: `/api/v1/data/search?q=query&type=articles&limit=50`

### 5. **Comprehensive Health Checks**
- Basic health: `/health`
- Ping endpoint: `/health/ping`
- Readiness check: `/health/ready`
- Detailed system information including memory, CPU, and database stats

### 6. **Advanced Analytics & Statistics**
- Article type distribution and statistics
- Subscription and area analytics
- Assignment tracking with user statistics
- Performance metrics and system monitoring

### 7. **API Versioning**
- RESTful API structure with version prefix `/api/v1/`
- Backward compatibility with legacy endpoints
- Clear endpoint documentation at root `/`

## 📊 Enhanced Endpoints

### Articles (`/api/v1/articles`)
- `GET /` - List articles with pagination, filtering, and search
- `GET /types` - Article type statistics
- `GET /:id` - Get specific article

### Subscriptions (`/api/v1/subscriptions`)
- `GET /` - List all subscriptions
- `GET /stats` - Subscription statistics
- `GET /:id` - Get specific subscription

### Areas (`/api/v1/areas`)
- `GET /` - List all areas
- `GET /stats` - Area statistics with status/color distribution
- `GET /:id` - Get specific area

### Assignments (`/api/v1/assignments`)
- `POST /` - Create assignment with validation
- `PUT /:articleId/:userName` - Update assignment
- `GET /user/:userName` - Get user assignments with statistics
- `GET /stats` - Assignment statistics (placeholder)

### Data Aggregation (`/api/v1/data`)
- `GET /all` - Get all data with counts
- `GET /summary` - Data summary with statistics
- `GET /search` - Global search functionality

### Admin (`/api/v1/admin`)
- `GET /status` - Comprehensive system status
- `POST /refresh` - Manual data refresh (rate limited)
- `GET /response-times` - API response time history
- `GET /response-stats` - Response time statistics
- `POST /cache/clear` - Clear cache (with optional pattern)
- `GET /cache/stats` - Cache performance statistics

## 🔧 Middleware Features

### Request Middleware
- Detailed request logging with timing
- JSON content type validation
- Enhanced CORS handling
- User-Agent tracking

### Rate Limiting
- IP-based rate limiting
- Different limits for different endpoint categories
- Detailed logging of rate limit violations
- Configurable windows and limits

### Caching
- TTL-based in-memory caching
- Cache headers (X-Cache, X-Cache-TTL)
- Performance monitoring
- Selective cache invalidation

## 📈 Database Enhancements

### New Tables
- `response_times` - Tracks API response performance
  - endpoint, response_time, status_code, success, error_message, timestamp

### Enhanced Queries
- Async/await pattern for all database operations
- Better error handling and logging
- Automatic cleanup of old response time data (7 days retention)

## 🛡️ Security & Performance

### Security Features
- Helmet.js for security headers
- Rate limiting to prevent abuse
- Input validation and sanitization
- CORS configuration
- Graceful shutdown handling

### Performance Features
- Response compression
- Efficient caching strategy
- Database connection pooling
- Memory usage monitoring
- Request/response timing

## 📖 Usage Examples

### Search across all data
```bash
GET /api/v1/data/search?q=jotihunt&limit=20
```

### Get articles with pagination and filtering
```bash
GET /api/v1/articles?page=2&limit=25&type=opdracht&search=punten
```

### Get response time statistics
```bash
GET /api/v1/admin/response-stats
```

### Clear cache for specific pattern
```bash
POST /api/v1/admin/cache/clear
Content-Type: application/json
{
  "pattern": "articles"
}
```

## 🚦 Error Handling

- Consistent error response format
- Detailed error logging
- Environment-specific error messages
- HTTP status code standardization
- Request correlation for debugging

## 📋 Migration Notes

- All existing endpoints remain functional under `/api/` prefix
- New versioned endpoints available under `/api/v1/` prefix
- Enhanced error responses with more detail
- Additional metadata in all responses
- Response time tracking starts immediately

This modular structure provides:
- ✅ Better maintainability
- ✅ Easier testing
- ✅ Clearer separation of concerns
- ✅ Enhanced monitoring capabilities
- ✅ Improved performance through caching
- ✅ Better security through rate limiting
- ✅ Comprehensive analytics and statistics
