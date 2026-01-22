# Apex Trading Bot - Frontend

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Angular](https://img.shields.io/badge/Angular-21.0-red)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)

Production-grade Angular UI for Apex Trading Bot. The UI is runtime-configured and derives all backend capabilities from `/api/ui/config`.

## ✅ What this UI Covers

- Authentication (email/password + broker OAuth)
- Runtime UI config + feature gating
- Strategy, signals, watchlist, scanner (manual runs)
- Orders lifecycle (paper mode + cancel)
- Health/status + WebSocket streaming (when exposed)

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm 10+
- Backend running and exposing `/api/ui/config`

### Install + Run

```bash
npm ci
npm start
```

The app is available at `http://localhost:4200`.

## 🔧 Runtime Configuration (No Hardcoding)

On boot, the UI fetches:

```
GET /api/ui/config
```

Expected shape (example):

```ts
interface RuntimeConfig {
  apiBaseUrl: string;
  wsBaseUrl?: string;
  endpoints: Array<{ method: string; path: string; description?: string }>;
}
```

- **No API base URLs are hardcoded** in `environment.ts`.
- UI calls are always relative (`/api/...`), then prefixed via `RuntimeConfigService` + `BaseUrlInterceptor`.
- If `/api/ui/config` is unavailable, the UI boots into a safe mode (login only) and shows a warning banner.

### Environment Injection Options

- **Option A (recommended):** Backend serves `/api/ui/config` and UI uses it as source of truth.
- **Option B:** Nginx proxies `/api` and `/ws` to the backend, keeping UI calls relative.

## 🔐 Security Notes

- JWTs are stored in **memory + sessionStorage** (no localStorage).
- Protected routes use `AuthGuard` and `FeatureGuard`.
- 401/403 responses trigger a friendly logout experience.
- Error interceptor normalizes messages and avoids token leakage.

## 🧪 Testing

```bash
npm test
```

## 🏗️ Build

```bash
npm run build
```

Artifacts land in `dist/frontend`.

## 🐳 Docker

```bash
# Build container
docker build -t apex-trading-frontend .

# Run container
docker run -p 8080:80 apex-trading-frontend
```

### Docker Compose (example)

```bash
docker compose up --build
```

Edit `docker-compose.yml` or `nginx.conf` to match your backend host/ports.

## 🔧 Nginx Configuration

See `nginx.conf` for a production-ready SPA config with optional `/api` and `/ws` proxies and security headers.

### CSP Guidance

Add a Content-Security-Policy header in Nginx for your deployment. Keep it strict and allow only the script/style sources you need.

## 📌 Quick Troubleshooting

- **Backend unreachable:** Ensure `/api/ui/config` is reachable from the UI host.
- **401/403:** Re-authenticate or verify backend permissions.
- **CORS issues:** Allow the UI origin in the backend CORS policy.
