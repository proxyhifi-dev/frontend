# Apex Trading Bot UI Runbook

## Local setup

1. Install dependencies:
   ```bash
   npm ci
   ```

2. Start the UI:
   ```bash
   npm start
   ```
   The UI runs at `http://localhost:4200`.

3. Build the UI:
   ```bash
   npm run build
   ```

## Runtime config

On app startup the UI requests:

```
GET /api/ui/config
```

If the endpoint is unavailable, the UI boots in safe mode (login only) and shows a banner.

## Required backend settings

- Ensure `/api/ui/config` is reachable from the UI host.
- Allow the UI origin in backend CORS.
- Expose supported feature endpoints in the `endpoints` list returned by `/api/ui/config`.

## WebSocket behavior

- WebSocket connects after login and includes the Bearer token.
- Disconnects on logout.
- Subscriptions use user queues:
  - `/user/queue/positions`
  - `/user/queue/orders`
  - `/user/queue/summary`
  - `/user/queue/bot-status`
  - `/user/queue/signals`
  - `/user/queue/logs`
- `/topic/*` destinations are only used when exposed via `wsTopics` in runtime config.

## Troubleshooting

- **CORS error (status 0/403):** confirm backend CORS allows the UI origin.
- **401/expired session:** log in again; refresh tokens are used only if the backend exposes `/auth/refresh`.
- **WebSocket not connecting:** confirm the backend provides `wsBaseUrl` and the login token is valid.
