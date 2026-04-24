# Research: Infraestructura Docker

## Decision: Docker Compose local con servicios `proxy`, `frontend` y `backend`

**Rationale**: La especificacion exige arranque reproducible de frontend, backend y proxy.
Compose es suficiente para un entorno local/LAN de bajo volumen y coincide con la
constitucion del proyecto. Mantener tres servicios hace explicita la responsabilidad de
cada componente sin introducir orquestacion innecesaria.

**Alternatives considered**:
- Un solo contenedor con todo el sistema: reduce archivos, pero mezcla responsabilidades y dificulta diagnostico.
- Ejecutar frontend/backend con comandos locales: ya funciona para desarrollo, pero no cumple reproducibilidad de despliegue.
- Kubernetes o Swarm: excede el alcance local-first y agrega operacion innecesaria.

## Decision: Nginx como punto de entrada unico en `http://ventas.local`

**Rationale**: El usuario necesita evitar puertos tecnicos. Nginx puede servir o enrutar
el frontend y pasar `/api/*` al backend manteniendo una sola URL local. Esto tambien
facilita diagnostico porque el health del backend queda accesible desde el mismo origen.

**Alternatives considered**:
- Exponer Vite y backend por puertos separados: simple, pero contradice el punto de entrada unico.
- Usar el servidor de desarrollo del frontend en produccion local: util para desarrollo, menos reproducible como despliegue.
- Proxy embebido en backend: mezcla frontend/proxy con API y reduce separacion.

## Decision: Frontend como build estatico y API con rutas relativas bajo `/api`

**Rationale**: El proxy permite que el navegador use el mismo origen para UI y API. Una
base relativa evita que el usuario configure `VITE_API_URL` para el caso Docker local y
reduce problemas de CORS. Las exportaciones deben usar el mismo cliente/base para no
volver a `localhost:8000`.

**Alternatives considered**:
- Mantener `http://localhost:8000` como default: rompe `ventas.local` y expone detalle interno.
- Inyectar URL absoluta por entorno: valido para otros ambientes, pero innecesario para el flujo local principal.
- Duplicar logica de llamadas para exportaciones: aumenta riesgo de inconsistencias.

## Decision: Persistencia SQLite local montada para backend

**Rationale**: La constitucion define SQLite inicial y compatibilidad futura con
PostgreSQL. Para Docker local, el backend debe conservar `ventas.db` entre reinicios sin
agregar un servicio de base de datos. Un volumen o bind mount controlado cumple la
reproducibilidad y mantiene datos locales.

**Alternatives considered**:
- Base de datos efimera dentro de la imagen: pierde datos al reconstruir.
- Agregar PostgreSQL ahora: puede ser una evolucion futura, pero excede el alcance de despliegue local inicial.
- Compartir todo el directorio backend como volumen: util para desarrollo, pero menos predecible para despliegue reproducible.

## Decision: Documentacion operativa en `docs/docker-local.md`

**Rationale**: La feature exige documentar hosts y diagnostico. Un documento dedicado
permite explicar preparacion, entrada `ventas.local`, arranque, apagado, reinicio,
health checks y fallas comunes sin mezclarlo con especificaciones internas.

**Alternatives considered**:
- Solo comentarios en `docker-compose.yml`: insuficiente para usuarios que deben editar hosts.
- README general: podria crecer demasiado; se puede enlazar al documento dedicado.
- Wiki externa: no cumple versionado junto al proyecto.
