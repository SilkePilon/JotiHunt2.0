# JotiHunt Backend API

A containerized backend API that aggregates data from various JotiHunt API endpoints and provides a unified interface for the frontend application.

## 🚀 Features

- **Data Aggregation**: Fetches data from multiple JotiHunt API endpoints
- **Caching**: In-memory caching with automatic refresh every 5 minutes
- **Docker Support**: Fully containerized with Docker and Docker Compose
- **Health Monitoring**: Built-in health checks and monitoring
- **Error Handling**: Robust error handling and logging
- **CORS Support**: Configured for frontend integration

## 📋 API Endpoints

### Data Endpoints
- `GET /api/articles` - Get all JotiHunt articles
- `GET /api/teams` - Get all teams data
- `GET /api/areas` - Get all areas data  
- `GET /api/stats` - Get statistics data
- `GET /api/all` - Get all data in one response

### Management Endpoints
- `GET /health` - Health check endpoint
- `POST /api/refresh` - Force refresh cached data

## 🐋 Docker Setup

### Using Docker Compose (Recommended)

1. **Build and run:**
   ```bash
   cd backend
   docker-compose up --build
   ```

2. **Run in background:**
   ```bash
   docker-compose up -d
   ```

3. **Stop:**
   ```bash
   docker-compose down
   ```

### Using Docker directly

1. **Build image:**
   ```bash
   docker build -t jotihunt-backend .
   ```

2. **Run container:**
   ```bash
   docker run -p 3001:3001 jotihunt-backend
   ```

## 💻 Local Development

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start development server:**
   ```bash
   npm run dev
   ```

3. **Start production server:**
   ```bash
   npm start
   ```

## 🔧 Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3001` | Server port |
| `NODE_ENV` | `development` | Environment mode |
| `JOTIHUNT_API_BASE` | `https://jotihunt.nl/api/2.0` | JotiHunt API base URL |

## 📊 API Response Format

All endpoints return data in this format:

```json
{
  "success": true,
  "data": [...],
  "cached": true,
  "timestamp": "2025-01-07T10:30:00.000Z"
}
```

## 🔄 Data Refresh

- **Automatic**: Every 5 minutes via cron job
- **Manual**: POST request to `/api/refresh`
- **On startup**: Initial data fetch when server starts

## 🏥 Health Monitoring

- Health check endpoint: `GET /health`
- Docker health checks included
- Logging with timestamps and structured format

## 🛡️ Security Features

- Helmet.js for security headers
- CORS configured for frontend domains
- Request compression
- Input validation and sanitization

## 📝 Logging

Structured logging with:
- Timestamp
- Log level (INFO, WARN, ERROR, DEBUG)
- Request logging
- Error tracking
- Performance metrics

## 🚦 Getting Started

1. **Start the backend:**
   ```bash
   cd backend
   docker-compose up --build
   ```

2. **Verify it's running:**
   ```bash
   curl http://localhost:3001/health
   ```

3. **Test data endpoints:**
   ```bash
   curl http://localhost:3001/api/articles
   ```

The API will be available at `http://localhost:3001`
