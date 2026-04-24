# Data Model: Infraestructura Docker

Esta feature no agrega entidades persistentes de negocio. El modelo describe recursos
operativos versionados y verificables del despliegue local.

## Despliegue Local

**Purpose**: Representa el entorno reproducible que permite operar LATAS Ventas desde
una maquina local o LAN.

**Attributes**:
- `name`: identificador operativo del despliegue local.
- `entrypoint`: URL principal para usuarios, esperada como `http://ventas.local`.
- `services`: conjunto de componentes requeridos: proxy, frontend y backend.
- `storage`: ubicacion persistente del archivo/volumen de datos local.
- `status`: estado observado durante diagnostico: iniciado, detenido o degradado.

**Relationships**:
- Contiene uno o mas `Componente de Aplicacion`.
- Usa un `Host Local` para resolver el nombre amigable.
- Expone uno o mas `Health Check`.

**Validation Rules**:
- Debe incluir frontend, backend y proxy para considerarse completo.
- Debe tener exactamente un punto de entrada documentado para usuarios.
- Debe poder detenerse y reiniciarse sin cambiar el punto de entrada.

## Componente de Aplicacion

**Purpose**: Representa una parte ejecutable del despliegue.

**Attributes**:
- `name`: `proxy`, `frontend` o `backend`.
- `responsibility`: proxy local, interfaz web o API de negocio.
- `internal_port`: puerto usado dentro de la red de contenedores.
- `public_exposure`: indica si el componente se expone al usuario directamente.
- `health_signal`: comprobacion esperada para saber si esta disponible.

**Relationships**:
- Pertenece a un `Despliegue Local`.
- El `proxy` enruta al `frontend` y al `backend`.
- El `frontend` consume el `backend` mediante rutas bajo `/api`.

**Validation Rules**:
- Solo el proxy debe ser punto de entrada directo para el usuario en el flujo `ventas.local`.
- El backend debe conservar la fuente de verdad de reglas de negocio.
- El frontend no debe requerir puertos internos para que el usuario opere.

## Host Local

**Purpose**: Entrada del sistema operativo que resuelve `ventas.local` hacia el entorno
local.

**Attributes**:
- `hostname`: `ventas.local`.
- `address`: direccion local esperada, normalmente `127.0.0.1`.
- `configured_by`: usuario tecnico u operador avanzado con permisos.
- `validation_method`: comando o prueba de navegador para confirmar resolucion.

**Relationships**:
- Apunta al `Punto de Entrada` del proxy local.

**Validation Rules**:
- Debe estar documentado con ruta de archivo hosts para Windows y sistemas Unix-like.
- Debe poder validarse sin consultar documentacion externa.

## Punto de Entrada

**Purpose**: URL estable usada por usuarios y pruebas de humo.

**Attributes**:
- `url`: `http://ventas.local`.
- `api_prefix`: prefijo publico para API, esperado como `/api`.
- `frontend_route`: rutas SPA servidas por frontend/proxy.
- `health_url`: URL de comprobacion, esperada como `http://ventas.local/api/health`.

**Relationships**:
- Usa `Host Local`.
- Es servido por el componente `proxy`.

**Validation Rules**:
- Debe abrir la aplicacion sin requerir puerto visible.
- Debe permitir comprobar backend desde el mismo origen.
- Debe preservar exportaciones y operaciones existentes bajo rutas de backend.

## State Transitions

```text
no preparado -> preparado -> iniciado -> verificado -> detenido
                         \-> degradado -> reiniciado -> verificado
```

- `no preparado`: faltan imagenes, variables o entrada hosts.
- `preparado`: configuracion y hosts listos.
- `iniciado`: servicios arrancados.
- `verificado`: UI y health check responden desde `ventas.local`.
- `degradado`: uno o mas componentes no responden.
- `detenido`: servicios apagados de forma ordenada.
