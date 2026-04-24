# Quickstart: Infraestructura Docker

## Prerequisites

- Docker Desktop or Docker Engine with Compose support.
- Permission to edit the operating system hosts file.
- Project dependencies available locally or internet access for the first image build.

## Configure hosts

Add this entry to the local hosts file:

```text
127.0.0.1 ventas.local
```

Common hosts file locations:

- Windows: `C:\Windows\System32\drivers\etc\hosts`
- Linux/macOS: `/etc/hosts`

Validate name resolution:

```powershell
ping ventas.local
```

## Start

From the repository root:

```powershell
docker compose up --build
```

Open:

```text
http://ventas.local
```

## Verify

Check the backend through the same local entrypoint:

```powershell
Invoke-RestMethod http://ventas.local/api/health
```

Expected response:

```json
{
  "status": "ok"
}
```

Check service status:

```powershell
docker compose ps
```

## Stop

```powershell
docker compose down
```

## Restart

```powershell
docker compose down
docker compose up --build
```

## Troubleshooting

If `ventas.local` does not open:

- Confirm the hosts entry exists and has no typo.
- Confirm the proxy service is running with `docker compose ps`.
- Confirm no other local service is using the proxy public port.

If the UI opens but data does not load:

- Check `http://ventas.local/api/health`.
- Inspect backend logs with `docker compose logs backend`.
- Inspect proxy logs with `docker compose logs proxy`.

If changes are not reflected:

- Rebuild with `docker compose up --build`.
- Confirm the frontend build uses `/api` or the documented local API base.
