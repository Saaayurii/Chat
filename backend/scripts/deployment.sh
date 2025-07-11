#!/bin/bash

# Production deployment script

set -e

echo "🚀 Starting production deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running. Please start Docker first.${NC}"
    exit 1
fi

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ docker-compose is not installed${NC}"
    exit 1
fi

# Load environment variables
if [ -f .env.production ]; then
    echo -e "${GREEN}✅ Loading production environment variables${NC}"
    set -a
    source .env.production
    set +a
else
    echo -e "${YELLOW}⚠️  No .env.production file found, using defaults${NC}"
fi

# Build and start services
echo -e "${GREEN}🔨 Building Docker images...${NC}"
docker-compose -f docker-compose.yml build --no-cache

echo -e "${GREEN}🗄️  Starting database services...${NC}"
docker-compose -f docker-compose.yml up -d mongo redis

echo -e "${GREEN}⏳ Waiting for services to be ready...${NC}"
sleep 10

# Check if services are healthy
echo -e "${GREEN}🏥 Checking service health...${NC}"
docker-compose -f docker-compose.yml ps

# Run database migrations if needed
echo -e "${GREEN}📊 Running database setup...${NC}"
# Add your migration commands here

# Start application
echo -e "${GREEN}🚀 Starting application...${NC}"
docker-compose -f docker-compose.yml up -d app

# Wait for application to be ready
echo -e "${GREEN}⏳ Waiting for application to start...${NC}"
sleep 30

# Health check
echo -e "${GREEN}🏥 Performing health check...${NC}"
if curl -f http://localhost:3000/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Application is healthy!${NC}"
else
    echo -e "${RED}❌ Health check failed${NC}"
    echo "Application logs:"
    docker-compose -f docker-compose.yml logs app
    exit 1
fi

# Start load balancer if needed
echo -e "${GREEN}⚖️  Starting load balancer...${NC}"
docker-compose -f docker-compose.yml --profile production up -d nginx

echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
echo -e "${GREEN}🌐 Application is available at: http://localhost${NC}"
echo -e "${GREEN}📚 API Documentation: http://localhost/api-docs${NC}"
echo -e "${GREEN}🏥 Health check: http://localhost/health${NC}"

echo -e "${YELLOW}📋 To scale the application:${NC}"
echo -e "${YELLOW}   docker-compose -f docker-compose.yml --profile scale up -d app-scale${NC}"

echo -e "${YELLOW}📊 To view logs:${NC}"
echo -e "${YELLOW}   docker-compose -f docker-compose.yml logs -f app${NC}"

echo -e "${YELLOW}🛑 To stop the application:${NC}"
echo -e "${YELLOW}   docker-compose -f docker-compose.yml down${NC}"