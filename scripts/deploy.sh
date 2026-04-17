#!/bin/bash

# X-Ray Protocol Deployment Script
# This script deploys the application to production

set -e

echo "Deploying X-Ray Protocol to production..."

# Configuration
ENVIRONMENT=${1:-production}
BACKEND_URL=${BACKEND_URL:-"https://api.xray-protocol.com"}
FRONTEND_URL=${FRONTEND_URL:-"https://xray-protocol.com"}
CONTRACT_ADDRESS=${CONTRACT_ADDRESS:-""}

echo "Environment: $ENVIRONMENT"
echo "Backend URL: $BACKEND_URL"
echo "Frontend URL: $FRONTEND_URL"

# Check if required environment variables are set
if [ -z "$CONTRACT_ADDRESS" ]; then
    echo "Error: CONTRACT_ADDRESS environment variable is required for production deployment."
    exit 1
fi

# Build smart contracts
echo "Building smart contracts..."
cd smart-contracts
npm run compile
echo "Smart contracts built successfully."

# Deploy smart contracts (if not already deployed)
echo "Verifying smart contract deployment..."
if [ "$ENVIRONMENT" = "production" ]; then
    npm run verify:production
else
    npm run deploy:staging
fi
cd ..

# Build backend
echo "Building backend..."
cd backend
npm run build
echo "Backend built successfully."

# Build frontend
echo "Building frontend..."
cd ../frontend
npm run build
echo "Frontend built successfully."

# Create production Docker images
echo "Creating production Docker images..."
cd ..

# Build and push backend image
docker build -t xray-protocol/backend:latest ./backend
docker tag xray-protocol/backend:latest xray-protocol/backend:$ENVIRONMENT
if [ "$ENVIRONMENT" = "production" ]; then
    docker push xray-protocol/backend:latest
    docker push xray-protocol/backend:production
fi

# Build and push frontend image
docker build -t xray-protocol/frontend:latest ./frontend
docker tag xray-protocol/frontend:latest xray-protocol/frontend:$ENVIRONMENT
if [ "$ENVIRONMENT" = "production" ]; then
    docker push xray-protocol/frontend:latest
    docker push xray-protocol/frontend:production
fi

echo "Docker images built and pushed successfully."

# Update production environment files
echo "Updating production environment files..."

# Backend environment
cat > backend/.env.production << EOF
NODE_ENV=production
PORT=5000
FRONTEND_URL=$FRONTEND_URL
MONGODB_URI=$MONGODB_URI
REDIS_URL=$REDIS_URL
ETHEREUM_RPC_URL=$ETHEREUM_RPC_URL
XRAY_IDENTITY_CONTRACT_ADDRESS=$CONTRACT_ADDRESS
JWT_SECRET=$JWT_SECRET
ENCRYPTION_KEY=$ENCRYPTION_KEY
LOG_LEVEL=warn
EOF

# Frontend environment
cat > frontend/.env.production << EOF
VITE_API_URL=$BACKEND_URL
VITE_ETHEREUM_RPC_URL=$ETHEREUM_RPC_URL
VITE_XRAY_IDENTITY_CONTRACT_ADDRESS=$CONTRACT_ADDRESS
VITE_APP_NAME=X-Ray Protocol
VITE_APP_VERSION=1.0.0
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_DEBUG=false
EOF

echo "Environment files updated."

# Deploy to production (using Docker Compose)
if [ "$ENVIRONMENT" = "production" ]; then
    echo "Deploying to production..."
    
    # Update docker-compose.yml for production
    sed -i 's/localhost:5000/api.xray-protocol.com/g' docker-compose.yml
    sed -i 's/localhost:3000/xray-protocol.com/g' docker-compose.yml
    
    # Deploy
    docker-compose -f docker-compose.prod.yml up -d
    
    echo "Production deployment completed!"
    echo "Application is available at: $FRONTEND_URL"
else
    echo "Staging deployment completed!"
    echo "Application is available at: $FRONTEND_URL"
fi

# Run health checks
echo "Running health checks..."
sleep 30

# Check backend health
if curl -f "$BACKEND_URL/health" > /dev/null 2>&1; then
    echo "Backend health check passed."
else
    echo "Backend health check failed!"
    exit 1
fi

# Check frontend health
if curl -f "$FRONTEND_URL/health" > /dev/null 2>&1; then
    echo "Frontend health check passed."
else
    echo "Frontend health check failed!"
    exit 1
fi

echo ""
echo "Deployment completed successfully!"
echo ""
echo "Production URLs:"
echo "Frontend: $FRONTEND_URL"
echo "Backend API: $BACKEND_URL"
echo "Smart Contract: $CONTRACT_ADDRESS"
echo ""
echo "Next steps:"
echo "1. Update DNS records if needed"
echo "2. Configure SSL certificates"
echo "3. Set up monitoring and logging"
echo "4. Update documentation"
