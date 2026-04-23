# Implementation Guardrails - Core Backend y Modelo de Datos

## In-Scope (Fase 1)

- Estructura base del backend FastAPI.
- Configuración DB con SQLAlchemy + SQLite.
- Modelos `Cliente`, `Venta`, `Pago` con relaciones estructurales.
- Endpoint `GET /api/health`.
- Base de despliegue local con `docker-compose.yml` y `backend/Dockerfile`.

## Explicitly Out of Scope

- Validación de conciliación `sum(pagos) == valor_total`.
- Flujos de autenticación de usuario final.
- JWT administrativo completo.
- Reportes, exportaciones y dashboard funcionales.
- Integración de IA (`/api/analisis`).

## Rule

Si una tarea propuesta introduce reglas de negocio avanzada o módulos de fases posteriores,
se debe diferir a un nuevo feature y no implementarse en esta fase.
