# Deployment Contract: Infraestructura Docker

## Public User Entry

- URL: `http://ventas.local`
- Expected behavior: opens the LATAS Ventas frontend.
- Visible ports: users should not need to enter frontend or backend ports.
- Host requirement: `ventas.local` resolves to the local machine address documented in `docs/docker-local.md`.

## Public API Through Proxy

- API prefix: `/api`
- Health endpoint: `GET http://ventas.local/api/health`
- Expected health response:

```json
{
  "status": "ok"
}
```

## Compose Services

| Service | Responsibility | User-facing | Required |
|---------|----------------|-------------|----------|
| `proxy` | Single local entrypoint and reverse proxy | Yes | Yes |
| `frontend` | Built web interface | No, routed by proxy | Yes |
| `backend` | FastAPI business API and persistence access | No, routed by proxy | Yes |

## Routing Rules

| Public path | Destination | Expected behavior |
|-------------|-------------|-------------------|
| `/` | frontend | Serves the web application |
| `/assets/*` | frontend | Serves built frontend assets |
| `/api/*` | backend | Preserves backend API paths and responses |

## Operational Commands

The implementation must document commands for:

- start the full deployment
- stop the full deployment
- restart the full deployment
- rebuild images after configuration changes
- inspect service status
- inspect logs for proxy, frontend and backend

## Acceptance Checks

The deployment is considered valid when:

- `http://ventas.local` opens the frontend.
- `http://ventas.local/api/health` returns `{"status":"ok"}`.
- Frontend operations that read or write business data use `/api` through the proxy.
- Restarting the deployment keeps the same user entrypoint.
- The hosts entry is documented for Windows and Unix-like systems.
