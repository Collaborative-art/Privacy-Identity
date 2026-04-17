#!/bin/bash

# X-Ray Protocol Setup Script
# This script sets up the entire development environment

set -e

echo "Setting up X-Ray Protocol development environment..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2)
REQUIRED_NODE_VERSION="16.0.0"

if [ "$(printf '%s\n' "$REQUIRED_NODE_VERSION" "$NODE_VERSION" | sort -V | head -n1)" != "$REQUIRED_NODE_VERSION" ]; then
    echo "Node.js version $NODE_VERSION is too old. Please install Node.js $REQUIRED_NODE_VERSION or higher."
    exit 1
fi

echo "Node.js version $NODE_VERSION detected."

# Install root dependencies
echo "Installing root dependencies..."
npm install

# Install smart contract dependencies
echo "Installing smart contract dependencies..."
cd smart-contracts
npm install
cd ..

# Install backend dependencies
echo "Installing backend dependencies..."
cd backend
npm install
cd ..

# Install frontend dependencies
echo "Installing frontend dependencies..."
cd frontend
npm install
cd ..

# Create environment files
echo "Setting up environment files..."

# Smart contracts
if [ ! -f "smart-contracts/.env" ]; then
    cp smart-contracts/.env.example smart-contracts/.env
    echo "Created smart-contracts/.env. Please update with your configuration."
fi

# Backend
if [ ! -f "backend/.env" ]; then
    cp backend/.env.example backend/.env
    echo "Created backend/.env. Please update with your configuration."
fi

# Frontend
if [ ! -f "frontend/.env" ]; then
    cp frontend/.env.example frontend/.env
    echo "Created frontend/.env. Please update with your configuration."
fi

# Create necessary directories
echo "Creating necessary directories..."
mkdir -p backend/logs
mkdir -p backend/uploads
mkdir -p nginx/ssl

# Set up MongoDB initialization script
echo "Setting up MongoDB initialization script..."
cat > scripts/mongo-init.js << 'EOF'
// MongoDB initialization script
db = db.getSiblingDB('xray-protocol');

// Create collections
db.createCollection('users');
db.createCollection('credentials');
db.createCollection('verificationrequests');

// Create indexes
db.users.createIndex({ "walletAddress": 1 }, { unique: true });
db.users.createIndex({ "email": 1 }, { unique: true });
db.users.createIndex({ "identityHash": 1 });
db.credentials.createIndex({ "credentialId": 1 }, { unique: true });
db.credentials.createIndex({ "userId": 1 });
db.credentials.createIndex({ "type": 1 });
db.verificationrequests.createIndex({ "requestId": 1 }, { unique: true });
db.verificationrequests.createIndex({ "requester": 1 });
db.verificationrequests.createIndex({ "targetIdentityHash": 1 });

print("MongoDB initialized successfully");
EOF

echo "MongoDB initialization script created."

# Set up Nginx configuration
echo "Setting up Nginx configuration..."
cat > nginx/nginx.conf << 'EOF'
events {
    worker_connections 1024;
}

http {
    upstream backend {
        server backend:5000;
    }

    upstream frontend {
        server frontend:80;
    }

    server {
        listen 80;
        server_name localhost;

        # Frontend
        location / {
            proxy_pass http://frontend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Backend API
        location /api/ {
            proxy_pass http://backend/api/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Health check
        location /health {
            access_log off;
            return 200 "healthy\n";
            add_header Content-Type text/plain;
        }
    }
}
EOF

echo "Nginx configuration created."

# Make setup script executable
chmod +x scripts/setup.sh

echo ""
echo "Setup completed successfully!"
echo ""
echo "Next steps:"
echo "1. Update the environment files with your configuration:"
echo "   - smart-contracts/.env"
echo "   - backend/.env"
echo "   - frontend/.env"
echo ""
echo "2. Start the development environment:"
echo "   npm run start:dev"
echo ""
echo "3. Or use Docker:"
echo "   docker-compose up -d"
echo ""
echo "4. Deploy smart contracts:"
echo "   cd smart-contracts"
echo "   npm run deploy:local"
echo ""
echo "5. Access the application:"
echo "   Frontend: http://localhost:3000"
echo "   Backend API: http://localhost:5000"
echo "   MongoDB: localhost:27017"
echo "   Redis: localhost:6379"
echo ""
echo "For more information, see the README.md file."
