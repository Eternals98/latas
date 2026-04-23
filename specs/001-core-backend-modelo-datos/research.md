# Research: Core Backend y Modelo de Datos

## Decision 1: Usar arquitectura monolítica modular para backend
- **Decision**: Implementar un único backend FastAPI organizado por módulos internos (`api`, `models`, `db`, `core`).
- **Rationale**: Cumple principio de simplicidad, reduce fricción de despliegue local y evita sobreingeniería.
- **Alternatives considered**:
  - Microservicios por módulo (rechazado: complejidad injustificada para fase 1).
  - Arquitectura hexagonal completa desde inicio (rechazado: capas innecesarias para alcance actual).

## Decision 2: SQLAlchemy 2.x + SQLite inicial con diseño portable
- **Decision**: Usar SQLAlchemy declarativo 2.x con tipos y convenciones compatibles para futura migración a PostgreSQL.
- **Rationale**: Balancea arranque rápido y evolución controlada sin rediseño estructural.
- **Alternatives considered**:
  - SQL crudo SQLite (rechazado: acopla implementación al motor y dificulta migración).
  - PostgreSQL desde día 1 (rechazado: mayor carga operativa para un entorno local inicial).

## Decision 3: Inicialización de esquema con `create_all` en fase 1
- **Decision**: Crear tablas iniciales con `Base.metadata.create_all()` y dejar migraciones versionadas para fase posterior.
- **Rationale**: Es la opción más simple compatible con el requerimiento "migración inicial o create_all".
- **Alternatives considered**:
  - Alembic desde esta fase (rechazado por complejidad adicional no imprescindible en MVP técnico).

## Decision 4: Contrato API mínimo para health check
- **Decision**: Exponer `/api/health` como contrato de disponibilidad y diagnóstico básico.
- **Rationale**: Provee verificación operativa inmediata para equipo local.
- **Alternatives considered**:
  - Sin endpoint dedicado (rechazado: no hay verificación explícita de disponibilidad).
  - Endpoint con chequeos externos complejos (rechazado: fuera de alcance y no requerido).

## Decision 5: Cobertura de pruebas mínima orientada a base técnica
- **Decision**: Definir pruebas de humo para `/api/health` y pruebas básicas de relaciones de modelos.
- **Rationale**: Valida entregable técnico sin introducir lógica de negocio prematura.
- **Alternatives considered**:
  - Sin pruebas en esta fase (rechazado: reduce confianza en cimiento técnico).
  - Suite completa de integración de negocio (rechazado: no corresponde a alcance).

## Decision 6: Base Docker Compose sin despliegue completo
- **Decision**: Incluir `docker-compose.yml` y `backend/Dockerfile` como base de despliegue local-first.
- **Rationale**: Cumple principio constitucional de reproducibilidad local sin expandir el alcance funcional de fase 1.
- **Alternatives considered**:
  - Posponer cualquier artefacto Docker (rechazado: deja incumplimiento constitucional).
  - Implementar stack completo de contenedores desde ahora (rechazado: sobrealcance para este feature).

## Implementation Status

- Estructura backend creada y modular.
- Configuración DB y modelos iniciales implementados.
- Endpoint `/api/health` implementado con esquema de respuesta.
- Scripts de validación estructural y escenarios de relación implementados.
- Base Docker Compose agregada (preparación, no despliegue full).

## Phase-2 Carryovers

- Migraciones versionadas (Alembic).
- Regla de conciliación pagos vs total de venta.
- Seguridad administrativa JWT y control de permisos.
- Reportes/exportaciones funcionales.
