#!/bin/bash

# MilesWeb VPS Deployment Script
# Make this file executable: chmod +x deploy.sh

set -e

echo "🚀 Starting deployment to MilesWeb VPS..."

# Configuration
APP_NAME="login-app"
APP_DIR="/var/www/$APP_NAME"
DOMAIN="yourdomain.com"  # Replace with your domain
BACKEND_PORT="3001"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   print_warning "Running as root. Consider using a non-root user for security."
fi

# Update system
print_status "Updating system packages..."
if command -v apt &> /dev/null; then
    sudo apt update && sudo apt upgrade -y
elif command -v yum &> /dev/null; then
    sudo yum update -y
fi

# Install Node.js if not installed
if ! command -v node &> /dev/null; then
    print_status "Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# Install PM2 if not installed
if ! command -v pm2 &> /dev/null; then
    print_status "Installing PM2..."
    sudo npm install -g pm2
fi

# Install Nginx if not installed
if ! command -v nginx &> /dev/null; then
    print_status "Installing Nginx..."
    if command -v apt &> /dev/null; then
        sudo apt install nginx -y
    elif command -v yum &> /dev/null; then
        sudo yum install nginx -y
    fi
fi

# Create application directory
print_status "Setting up application directory..."
sudo mkdir -p $APP_DIR
sudo chown -R $USER:$USER $APP_DIR

# Copy application files (assuming script is run from project root)
print_status "Copying application files..."
cp -r . $APP_DIR/
cd $APP_DIR

# Setup backend
print_status "Setting up backend..."
cd backend

# Install backend dependencies
npm install --production

# Create .env if it doesn't exist
if [ ! -f .env ]; then
    cp .env.example .env
    print_warning "Please edit $APP_DIR/backend/.env with your production settings"
fi

# Setup frontend
print_status "Setting up frontend..."
cd ../frontend

# Install frontend dependencies
npm install

# Update API endpoint in frontend
print_status "Updating API endpoint..."
if [ "$DOMAIN" != "yourdomain.com" ]; then
    find src -name "*.jsx" -type f -exec sed -i "s|http://localhost:3001|https://$DOMAIN|g" {} \;
fi

# Build frontend
print_status "Building frontend..."
npm run build

# Setup PM2
print_status "Configuring PM2..."
cd $APP_DIR

# Create logs directory
mkdir -p logs

# Start backend with PM2
pm2 delete login-backend 2>/dev/null || true
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 startup
pm2 startup | grep -E '^sudo' | bash || print_warning "PM2 startup setup may need manual configuration"

# Configure Nginx
print_status "Configuring Nginx..."
sudo tee /etc/nginx/sites-available/$APP_NAME > /dev/null <<EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    
    # Frontend (React build)
    location / {
        root $APP_DIR/frontend/build;
        index index.html index.htm;
        try_files \$uri \$uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # Backend API
    location /api/ {
        proxy_pass http://localhost:$BACKEND_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
}
EOF

# Enable site
sudo ln -sf /etc/nginx/sites-available/$APP_NAME /etc/nginx/sites-enabled/

# Remove default site if it exists
sudo rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
if sudo nginx -t; then
    print_status "Nginx configuration is valid"
    sudo systemctl restart nginx
    sudo systemctl enable nginx
else
    print_error "Nginx configuration test failed"
    exit 1
fi

# Configure firewall
print_status "Configuring firewall..."
if command -v ufw &> /dev/null; then
    sudo ufw allow 22/tcp
    sudo ufw allow 80/tcp
    sudo ufw allow 443/tcp
    sudo ufw --force enable
elif command -v firewall-cmd &> /dev/null; then
    sudo firewall-cmd --permanent --add-service=ssh
    sudo firewall-cmd --permanent --add-service=http
    sudo firewall-cmd --permanent --add-service=https
    sudo firewall-cmd --reload
fi

print_status "Deployment completed successfully! 🎉"
print_status "Your application should be accessible at: http://$DOMAIN"
print_status ""
print_status "Next steps:"
print_status "1. Edit $APP_DIR/backend/.env with your SMS provider credentials"
print_status "2. Restart the backend: pm2 restart login-backend"
print_status "3. Consider setting up SSL with: sudo certbot --nginx -d $DOMAIN"
print_status ""
print_status "Useful commands:"
print_status "- Check status: pm2 status"
print_status "- View logs: pm2 logs login-backend"
print_status "- Restart app: pm2 restart login-backend"