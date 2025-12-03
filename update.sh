#!/bin/bash

# Update script for production deployment
# Usage: ./update.sh

set -e

APP_DIR="/var/www/login-app"  # Adjust to your app directory
BACKUP_DIR="/var/backups/login-app"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if app directory exists
if [ ! -d "$APP_DIR" ]; then
    print_error "Application directory $APP_DIR not found!"
    exit 1
fi

# Create backup
print_status "Creating backup..."
sudo mkdir -p $BACKUP_DIR
sudo cp -r $APP_DIR $BACKUP_DIR/backup-$(date +%Y%m%d-%H%M%S)

# Navigate to app directory
cd $APP_DIR

# Pull latest changes
print_status "Pulling latest changes..."
git pull origin main

# Update backend
print_status "Updating backend..."
cd backend
npm install --production

# Update frontend
print_status "Updating frontend..."
cd ../frontend
npm install
npm run build

# Restart backend
print_status "Restarting backend..."
pm2 restart login-backend

# Test if backend is running
sleep 5
if pm2 list | grep -q "login-backend.*online"; then
    print_status "Backend restarted successfully"
else
    print_error "Backend failed to restart"
    print_status "Rolling back..."
    # Restore from backup if needed
    exit 1
fi

# Reload Nginx
print_status "Reloading Nginx..."
sudo nginx -t && sudo systemctl reload nginx

print_status "Update completed successfully! 🎉"
print_status "Application status:"
pm2 status