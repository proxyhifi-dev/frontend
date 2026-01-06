# Deployment Guide - Apex Trading Bot Frontend

## 📋 Pre-deployment Checklist

- [ ] All tests passing
- [ ] Environment variables configured
- [ ] Backend API accessible
- [ ] SSL certificates ready (production)
- [ ] Domain configured
- [ ] CI/CD pipeline set up

## 🚀 Deployment Options

### Option 1: Docker Deployment (Recommended)

#### Step 1: Create Dockerfile

```dockerfile
# Build stage
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine
COPY --from=build /app/dist/frontend/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

#### Step 2: Create nginx.conf

```nginx
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Angular routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API proxy
    location /api {
        proxy_pass http://backend:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket proxy
    location /ws {
        proxy_pass http://backend:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_read_timeout 86400;
    }
}
```

#### Step 3: Build and Run

```bash
# Build image
docker build -t apex-trading-frontend:latest .

# Run container
docker run -d \
  --name apex-frontend \
  -p 80:80 \
  --restart unless-stopped \
  apex-trading-frontend:latest

# Check logs
docker logs -f apex-frontend
```

### Option 2: Docker Compose

```yaml
version: '3.8'

services:
  frontend:
    build: .
    ports:
      - "80:80"
    environment:
      - NODE_ENV=production
    depends_on:
      - backend
    restart: unless-stopped
    networks:
      - apex-network

  backend:
    image: apex-trading-backend:latest
    ports:
      - "8080:8080"
    environment:
      - SPRING_PROFILES_ACTIVE=prod
    restart: unless-stopped
    networks:
      - apex-network

networks:
  apex-network:
    driver: bridge
```

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

### Option 3: Traditional Deployment

#### Step 1: Build Production Bundle

```bash
npm run build
```

#### Step 2: Deploy to Server

```bash
# Copy files to server
scp -r dist/frontend/browser/* user@server:/var/www/html/

# Or use rsync
rsync -avz --delete dist/frontend/browser/ user@server:/var/www/html/
```

#### Step 3: Configure Nginx

```bash
# Create Nginx config
sudo nano /etc/nginx/sites-available/apex-trading

# Enable site
sudo ln -s /etc/nginx/sites-available/apex-trading /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

## 🔒 SSL/HTTPS Setup (Production)

### Using Let's Encrypt (Free)

```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal
sudo certbot renew --dry-run
```

### Nginx SSL Configuration

```nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # ... rest of config
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}
```

## 🌐 Environment Configuration

### Production Environment

Create `src/environments/environment.prod.ts`:

```typescript
export const environment = {
  production: true,
  apiUrl: 'https://api.yourdomain.com',
  wsUrl: 'wss://api.yourdomain.com/ws',
  fyersClientId: 'YOUR_PROD_FYERS_CLIENT_ID',
  fyersRedirectUri: 'https://yourdomain.com/auth/fyers/callback'
};
```

## 📊 Monitoring

### Health Check Endpoint

Add to Nginx:

```nginx
location /health {
    access_log off;
    return 200 "healthy\n";
    add_header Content-Type text/plain;
}
```

### Docker Health Check

```dockerfile
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/health || exit 1
```

## 🔄 CI/CD Pipeline

### GitHub Actions Example

```yaml
name: Deploy Frontend

on:
  push:
    branches: [master]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Build
        run: npm run build
        
      - name: Deploy to server
        uses: easingthemes/ssh-deploy@v2
        with:
          SSH_PRIVATE_KEY: ${{ secrets.SSH_PRIVATE_KEY }}
          REMOTE_HOST: ${{ secrets.REMOTE_HOST }}
          REMOTE_USER: ${{ secrets.REMOTE_USER }}
          SOURCE: "dist/frontend/browser/"
          TARGET: "/var/www/html/"
```

## 🚨 Rollback Strategy

```bash
# Tag current version
docker tag apex-trading-frontend:latest apex-trading-frontend:v1.0.0

# If rollback needed
docker stop apex-frontend
docker rm apex-frontend
docker run -d --name apex-frontend -p 80:80 apex-trading-frontend:v1.0.0
```

## 📈 Performance Optimization

### Enable Brotli Compression

```nginx
brotli on;
brotli_comp_level 6;
brotli_types text/plain text/css application/json application/javascript application/x-javascript text/xml application/xml application/xml+rss text/javascript;
```

### CDN Configuration

Use CloudFlare or similar CDN for static assets.

## ✅ Post-Deployment Checklist

- [ ] Application loads correctly
- [ ] All pages accessible
- [ ] API calls working
- [ ] WebSocket connected
- [ ] Authentication working
- [ ] SSL certificate valid
- [ ] Performance metrics acceptable
- [ ] Error logging configured
- [ ] Backup strategy in place
- [ ] Monitoring alerts set up

## 📞 Support

For deployment issues, contact the development team.

---

**Last Updated**: January 2026
