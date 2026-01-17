# Apex Trading Bot UI Runbook

## Local setup (against Render backend)

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the UI:
   ```bash
   npm start
   ```
   The UI will run at `http://localhost:4200` and will target the Render backend by default.

3. Build the UI:
   ```bash
   npm run build
   ```

## Environment defaults

The UI uses runtime config when available; otherwise it falls back to the environment defaults:

- `apiBaseUrl`: `https://apex-trading-bot-w74z.onrender.com/api`
- `wsUrl`: `wss://apex-trading-bot-w74z.onrender.com/ws`

## Runtime config endpoint

On app startup the UI fetches:

```
GET https://apex-trading-bot-w74z.onrender.com/api/ui/config
```

Expected fields:

- `apiBaseUrl` (string)
- `wsUrl` or `wsBaseUrl` (string)
- `endpoints` (array or object of endpoint strings)
- `wsTopics` (optional array of `/topic/*` destinations to enable)
- `entities` (optional entity field metadata)

If the endpoint is unavailable, the UI uses the environment defaults.

## Required backend CORS settings

When running the UI locally, ensure the backend includes this origin:

```
APEX_ALLOWED_ORIGINS=http://localhost:4200
```

If you see a 403 or network error in the UI, confirm the origin is configured in Render.

## WebSocket behavior

- WebSocket connects **after login** only and includes the Bearer token.
- WebSocket disconnects on logout.
- Subscriptions use user queues:
  - `/user/queue/positions`
  - `/user/queue/orders`
  - `/user/queue/summary`
  - `/user/queue/bot-status`
  - `/user/queue/signals`
  - `/user/queue/logs`
- `/topic/*` destinations are only used when the backend runtime config exposes them via `wsTopics`.

## Troubleshooting

- **CORS error (status 0/403):** confirm `APEX_ALLOWED_ORIGINS` includes `http://localhost:4200`.
- **401/expired session:** log in again; refresh token is used automatically when supported.
- **WebSocket not connecting:** verify `wss://apex-trading-bot-w74z.onrender.com/ws` is reachable and the login token is valid.
