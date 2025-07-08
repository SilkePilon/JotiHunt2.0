#!/bin/bash

echo "🚀 Starting JotiHunt Backend API..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Build and start the backend
echo "📦 Building and starting backend with Docker Compose..."
docker-compose up --build -d

# Wait for the service to be ready
echo "⏳ Waiting for backend to be ready..."
timeout 30 bash -c 'until curl -s http://localhost:3001/health > /dev/null; do sleep 1; done'

if [ $? -eq 0 ]; then
    echo "✅ Backend is ready!"
    echo "🌐 API available at: http://localhost:3001"
    echo "🔍 Health check: http://localhost:3001/health"
    echo "📊 Articles endpoint: http://localhost:3001/api/articles"
    echo ""
    echo "📋 Available commands:"
    echo "  - View logs: docker-compose logs -f"
    echo "  - Stop: docker-compose down"
    echo "  - Restart: docker-compose restart"
else
    echo "❌ Backend failed to start within 30 seconds"
    echo "📋 Check logs with: docker-compose logs"
    exit 1
fi
