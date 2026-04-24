# Docker Local

Esta guia describe el despliegue local de LATAS Ventas con Docker Compose, Nginx como
entrada unica y acceso por `http://ventas.local`.

## Requisitos

- Docker Desktop o Docker Engine con Compose.
- Permiso para editar el archivo `hosts` del sistema operativo.
- Internet disponible para el primer build, salvo que las imagenes y dependencias ya
  esten preparadas localmente.

## Configurar ventas.local

Agrega esta linea al archivo `hosts`:

```text
127.0.0.1 ventas.local
```

Ubicaciones habituales:

- Windows: `C:\Windows\System32\drivers\etc\hosts`
- Linux/macOS: `/etc/hosts`

Validacion rapida:

```powershell
ping ventas.local
```

## Arrancar

Desde la raiz del repositorio:

```powershell
docker compose up --build
```

Abre la aplicacion en:

```text
http://ventas.local
```

Verifica el backend a traves del mismo origen:

```powershell
Invoke-RestMethod http://ventas.local/api/health
```

Respuesta esperada:

```json
{
  "status": "ok"
}
```

## Operacion

Estado de servicios:

```powershell
docker compose ps
```

Logs de todos los servicios:

```powershell
docker compose logs
```

Logs por servicio:

```powershell
docker compose logs proxy
docker compose logs frontend
docker compose logs backend
```

Detener:

```powershell
docker compose down
```

Reiniciar:

```powershell
docker compose down
docker compose up --build
```

Reconstruir despues de cambios de configuracion o frontend:

```powershell
docker compose build --no-cache
docker compose up
```

## Diagnostico

Si `ventas.local` no resuelve:

- Confirma que el archivo `hosts` contiene `127.0.0.1 ventas.local`.
- Ejecuta `ping ventas.local`.
- Cierra y vuelve a abrir el navegador si tenia una resolucion anterior cacheada.

Si el puerto del proxy esta ocupado:

- Ejecuta `docker compose ps` y confirma si `proxy` esta iniciado.
- Deten el servicio local que usa el puerto 80, o cambia temporalmente el mapeo
  `80:80` en `docker-compose.yml`.

Si la UI abre pero los datos no cargan:

- Ejecuta `Invoke-RestMethod http://ventas.local/api/health`.
- Revisa `docker compose logs backend`.
- Revisa `docker compose logs proxy`.

Si el frontend parece desactualizado:

- Ejecuta `docker compose up --build`.
- Para descartar cache de imagen, ejecuta `docker compose build --no-cache frontend`.
- Confirma que las llamadas del navegador usen rutas `/api/...` bajo
  `http://ventas.local`.

## Operacion Offline

El primer build necesita imagenes base de Docker y paquetes de Python/Node disponibles
por red o cache local. Despues de preparar esas imagenes, el sistema puede arrancar y
reiniciarse sin internet mientras Docker conserve las imagenes construidas y el volumen
`ventas_data`.

Sin internet siguen disponibles:

- Inicio y parada con `docker compose up` y `docker compose down`.
- Acceso local a `http://ventas.local`.
- Persistencia SQLite en el volumen `ventas_data`.

Sin internet pueden fallar:

- Rebuilds que necesiten descargar imagenes base o dependencias nuevas.
- Instalacion de paquetes cambiados en `requirements.txt` o `package-lock.json`.
