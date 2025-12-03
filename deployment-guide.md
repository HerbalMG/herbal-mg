# MilesWeb VPS Deployment Guide

## Prerequisites

- MilesWeb VPS with Linux (Ubuntu/CentOS)
- SSH access to your VPS
- Domain name (optional but recommended)

## Step 1: VPS Initial Setup

### Connect to your VPS
```bash
ssh root@your-vps-ip
# or
ssh username@your-vps-ip
```

### Update system packages
```bash
# Ubuntu/Debian
sudo apt update && sudo apt upgrade -y

# CentOS/RHEL
sudo yum update -y
```

### Install Node.js and npm
```bash
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# CentOS/RHEL
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs npm
```

### Install PM2 (Process Manager)
```bash
sudo npm install -g pm2
```

### Install Nginx (Web Server)
```bash
# Ubuntu/Debian
sudo apt install nginx -y

# CentOS/RHEL
sudo yum install nginx -y
```

## Step 2: Upload Your Application

### Option A: Using Git (Recommended)
```bash
# Install git if not available
sudo apt install git -y  # Ubuntu
sudo yum install git -y  # CentOS

# Clone your repository
cd /var/www
sudo git clone https://github.com/yourusername/your-repo.git your-app
sudo chown -R $USER:$USER /var/www/your-app
cd your-app
```

### Option B: Using SCP/SFTP
```bash
# From your local machine
scp -r ./your-project root@your-vps-ip:/var/www/your-app
```

## Step 3: Backend Setup

```bash
cd /var/www/your-app/backend

# Install dependencies
npm install

# Create production environment file
cp .env.example .env
nano .env  # Edit with your production settings
```

### Configure your .env file:
```env
PORT=3001
NODE_ENV=production

# Choose your SMS provider and configure
TWILIO_ACCOUNT_SID=your_production_sid
TWILIO_AUTH_TOKEN=your_production_token
TWILIO_FROM_NUMBER=+1234567890

# Or use other SMS providers as documented
```

## Step 4: Frontend Setup

```bash
cd /var/www/your-app/frontend

# Install dependencies
npm install

# Update API endpoint for production
# Edit src/pages/Login/Login.jsx and replace localhost with your domain
sed -i 's/http:\/\/localhost:3001/https:\/\/yourdomain.com/g' src/pages/Login/Login.jsx

# Build for production
npm run build
```

## Step 5: Configure PM2 for Backend

```bash
cd /var/www/your-app/backend

# Start backend with PM2
pm2 start server.js --name "login-backend"

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Follow the instructions shown
```

## Step 6: Configure Nginx

### Create Nginx configuration
```bash
sudo nano /etc/nginx/sites-available/your-app
```

### Add this configuration:
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;  # Replace with your domain
    
    # Frontend (React build)
    location / {
        root /var/www/your-app/frontend/build;
        index index.html index.htm;
        try_files $uri $uri/ /index.html;
    }
    
    # Backend API
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Enable the site
```bash
sudo ln -s /etc/nginx/sites-available/your-app /etc/nginx/sites-enabled/
sudo nginx -t  # Test configuration
sudo systemctl restart nginx
sudo systemctl enable nginx
```

## Step 7: Configure Firewall

```bash
# Ubuntu (UFW)
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw enable

# CentOS (firewalld)
sudo firewall-cmd --permanent --add-service=ssh
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

## Step 8: SSL Certificate (Optional but Recommended)

### Install Certbot
```bash
# Ubuntu
sudo apt install certbot python3-certbot-nginx -y

# CentOS
sudo yum install certbot python3-certbot-nginx -y
```

### Get SSL certificate
```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

## Step 9: Monitoring and Maintenance

### Check application status
```bash
pm2 status
pm2 logs login-backend
sudo systemctl status nginx
```

### Update application
```bash
cd /var/www/your-app
git pull origin main

# Update backend
cd backend
npm install
pm2 restart login-backend

# Update frontend
cd ../frontend
npm install
npm run build
```

## Troubleshooting

### Common Issues:

1. **Port 3001 blocked**: Ensure firewall allows internal communication
2. **Permission issues**: Check file ownership with `chown -R www-data:www-data /var/www/your-app`
3. **Node.js version**: Ensure Node.js 16+ is installed
4. **SMS not working**: Verify SMS provider credentials in production .env

### Useful Commands:
```bash
# Check logs
pm2 logs
sudo tail -f /var/log/nginx/error.log

# Restart services
pm2 restart all
sudo systemctl restart nginx

# Check processes
pm2 monit
netstat -tlnp | grep :3001
```

## Security Recommendations

1. **Change default SSH port**
2. **Use SSH keys instead of passwords**
3. **Regular security updates**
4. **Monitor logs regularly**
5. **Use environment variables for sensitive data**
6. **Enable fail2ban for SSH protection**

Your application should now be live at your domain/IP address!