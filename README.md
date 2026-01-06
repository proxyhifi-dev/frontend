# Apex Trading Bot - Frontend

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Angular](https://img.shields.io/badge/Angular-21.0-red)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)

## 🚀 Features Completed (100%)

### ✅ Core Features
- [x] **Authentication System** - Login, Register, Fyers OAuth
- [x] **Real-time Dashboard** - Live market data and bot status
- [x] **Position Management** - Real-time position tracking
- [x] **Trade History** - Complete trade logging and analytics
- [x] **Analytics Dashboard** - Performance metrics and charts
- [x] **Risk Management** - Real-time risk monitoring
- [x] **Settings & Configuration** - Bot and strategy configuration
- [x] **WebSocket Integration** - Live data updates

### ✅ Technical Features
- [x] **Global Error Handling** - HTTP interceptor with retry logic
- [x] **Toast Notifications** - User-friendly feedback system
- [x] **Loading States** - Global and component-level loading
- [x] **Responsive Design** - Mobile, tablet, desktop support
- [x] **Performance Optimized** - OnPush change detection
- [x] **Type Safety** - Full TypeScript implementation

## 📋 Prerequisites

- Node.js 18+ and npm 10+
- Angular CLI 21+
- Backend API running on http://localhost:8080

## 🛠️ Installation

```bash
# Clone the repository
git clone https://github.com/proxyhifi-dev/frontend.git
cd frontend

# Install dependencies
npm install

# Start development server
npm start
```

The application will be available at `http://localhost:4200`

## 🔧 Configuration

### Environment Variables

Update `src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080/api',
  wsUrl: 'ws://localhost:8080/ws',
  fyersClientId: 'YOUR_FYERS_CLIENT_ID',
  fyersRedirectUri: 'http://localhost:4200/auth/fyers/callback'
};
```

### Production Build

```bash
npm run build
```

Build artifacts will be in the `dist/` directory.

## 📁 Project Structure

```
src/
├── app/
│   ├── core/                    # Core services and interceptors
│   │   ├── interceptors/       # HTTP interceptors
│   │   └── services/           # Global services
│   ├── features/               # Feature modules
│   │   ├── auth/              # Authentication
│   │   ├── dashboard/         # Dashboard
│   │   ├── positions/         # Positions
│   │   ├── trades/            # Trade history
│   │   ├── analytics/         # Analytics
│   │   ├── risk/              # Risk management
│   │   ├── signals/           # Trading signals
│   │   ├── logs/              # System logs
│   │   ├── settings/          # Settings
│   │   └── account/           # Account management
│   ├── layout/                # Layout components
│   │   ├── sidebar/
│   │   ├── header/
│   │   └── mobile-nav/
│   └── shared/                # Shared components
│       ├── components/
│       └── services/
├── environments/              # Environment configs
└── styles/                    # Global styles
```

## 🎯 Key Features Implemented

### 1. Global Error Handling
```typescript
// Automatic retry on network errors
// User-friendly error messages
// Toast notifications for all errors
```

### 2. Real-time WebSocket
```typescript
// Auto-reconnect on disconnect
// Multiple topic subscriptions
// Connection status monitoring
```

### 3. Loading Management
```typescript
// Global loading overlay
// Component-level loading states
// Smart request batching
```

### 4. Toast Notifications
```typescript
toastService.showSuccess('Trade executed!');
toastService.showError('Connection failed');
toastService.showWarning('Market closed');
toastService.showInfo('New update available');
```

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

## 📊 Performance

- **First Contentful Paint**: < 1.5s
- **Time to Interactive**: < 3.0s
- **Bundle Size**: ~500KB gzipped
- **Lighthouse Score**: 95+

## 🚀 Deployment

### Docker Deployment

```bash
# Build Docker image
docker build -t apex-trading-frontend .

# Run container
docker run -p 80:80 apex-trading-frontend
```

### Nginx Configuration

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://backend:8080;
    }

    location /ws {
        proxy_pass http://backend:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

## 🔒 Security

- JWT token authentication
- HTTPS in production
- Secure WebSocket (WSS)
- XSS protection
- CORS configured

## 🐛 Troubleshooting

### Common Issues

**WebSocket connection fails:**
```bash
# Check backend is running
curl http://localhost:8080/health

# Check WebSocket endpoint
wscat -c ws://localhost:8080/ws
```

**API calls fail:**
```typescript
// Verify environment configuration
// Check CORS settings on backend
// Ensure backend is running
```

**Build errors:**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

## 📝 Code Style

```bash
# Format code
npm run format

# Lint code
npm run lint
```

## 🤝 Contributing

1. Create feature branch: `git checkout -b feature/amazing-feature`
2. Commit changes: `git commit -m 'Add amazing feature'`
3. Push to branch: `git push origin feature/amazing-feature`
4. Open Pull Request

## 📄 License

Private - All Rights Reserved

## 👥 Authors

- **Developer** - Apex Trading Bot Team

## 🙏 Acknowledgments

- Angular team for the framework
- ApexCharts for charting library
- STOMP.js for WebSocket
- Community contributors

---

**Status**: ✅ Production Ready  
**Version**: 1.0.0  
**Last Updated**: January 2026
