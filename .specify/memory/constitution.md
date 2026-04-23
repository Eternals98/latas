<!--
Sync Impact Report
- Version change: N/A (template) -> 1.0.0
- Modified principles:
  - Template Principle 1 -> 1. Simplicidad sobre sobreingenieria
  - Template Principle 2 -> 2. Diseno orientado a dominio (ligero)
  - Template Principle 3 -> 3. Backend como unica fuente de verdad
  - Template Principle 4 -> 4. Persistencia simple pero escalable
  - Template Principle 5 -> 5. Seguridad pragmatica
  - Added principles 6-12 as explicit constitutional principles
- Added sections:
  - Restricciones Tecnicas y Arquitectonicas
  - Flujo de Entrega y Control de Fases
- Removed sections: None
- Templates requiring updates:
  - ✅ updated: .specify/templates/plan-template.md
  - ✅ updated: .specify/templates/spec-template.md
  - ✅ updated: .specify/templates/tasks-template.md
  - ⚠ pending: .specify/templates/checklist-template.md (sin cambios por ahora)
- Deferred TODOs:
  - None
-->
# LATAS Ventas Constitution

## Core Principles

### 1. Simplicidad sobre sobreingenieria
El sistema MUST priorizar soluciones simples, legibles y mantenibles.
Se PROHIBE introducir microservicios, capas arquitectonicas innecesarias o
patrones que no resuelvan un problema real de negocio.
Rationale: menos complejidad reduce costo operativo y acelera entregas.

### 2. Diseno orientado a dominio (ligero)
El modelo de datos MUST reflejar directamente el dominio de ventas.
Entidades base obligatorias: `Venta`, `Cliente`, `Pago`, con relaciones
explicitas (por ejemplo, `Venta 1:N Pago`).
Se PROHIBE modelar datos como estructuras heredadas de Excel.
Rationale: un dominio claro evita deuda tecnica y ambiguedad funcional.

### 3. Backend como unica fuente de verdad
Toda regla de negocio critica MUST ejecutarse en backend (FastAPI).
El frontend MUST limitarse a presentacion, captura y validaciones de UX.
Rationale: garantiza consistencia de reglas y evita bypass de controles.

### 4. Persistencia simple pero escalable
La persistencia inicial MUST usar SQLite con SQLAlchemy como ORM obligatorio.
El diseno de modelos y tipos MUST mantenerse compatible con PostgreSQL para
migracion futura sin redisenar entidades ni contratos.
Rationale: permite arrancar rapido sin bloquear escalabilidad.

### 5. Seguridad pragmatica
La seguridad MUST cumplir minimo viable para entorno local.
El flujo operativo NO requiere login para usuario normal.
Funciones administrativas MUST requerir password y JWT temporal.
Se PROHIBE incluir OAuth o proveedores externos en fases iniciales.
Rationale: seguridad suficiente con complejidad operativa controlada.

### 6. Modularidad funcional clara
La solucion MUST organizarse por modulos funcionales independientes:
`Ventas`, `Clientes`, `Reportes`, `Administracion`, `Analisis (LLM opcional)`.
Cada modulo MUST tener limites de responsabilidad y contratos claros.
Rationale: facilita mantenimiento y evolucion incremental.

### 7. UI orientada a productividad
La interfaz MUST optimizar velocidad de registro y consulta minimizando friccion.
Se consideran obligatorios formularios rapidos, autocompletado, entradas
dinamicas de formas de pago y validaciones visuales inmediatas.
Rationale: la productividad operativa es un objetivo principal del sistema.

### 8. Integracion con IA desacoplada
Toda capacidad LLM MUST ser opcional y desacoplada del nucleo transaccional.
La integracion MUST exponerse por endpoint separado (`/api/analisis`) y NO debe
afectar disponibilidad de ventas, clientes o reportes base.
Rationale: evita acoplar operacion critica a componentes experimentales.

### 9. Exportacion como compatibilidad operativa
El sistema MUST permitir exportaciones a Excel para continuidad operativa.
Las exportaciones MUST mantenerse separadas por `Formal` e `Informal` con formato
entendible por negocio.
Rationale: compatibilidad con procesos actuales mientras se adopta la app.

### 10. Despliegue reproducible y local-first
El despliegue estandar MUST ser local y reproducible con Docker Compose.
El sistema MUST operar sin servicios cloud obligatorios y con capacidad offline.
Rationale: prioridad de continuidad operativa en red local.

### 11. Trazabilidad minima
Toda entidad transaccional relevante MUST incluir `creado_en`, `modificado_en`
y estado logico (`activo`/`anulado` o equivalente).
La auditoria detallada se define como extension de fase posterior.
Rationale: habilita control basico sin sobrecargar la primera version.

### 12. Evolucion controlada por fases
La entrega MUST seguir fases para evitar sobreimplementacion temprana:
1) Registro + DB, 2) Reportes + exportacion, 3) Admin + edicion,
4) Dashboard, 5) IA.
Ninguna fase posterior MUST bloquear el cierre funcional de la fase activa.
Rationale: reduce riesgo y mejora foco de ejecucion.

## Restricciones Tecnicas y Arquitectonicas

- Stack base obligatorio: FastAPI + SQLAlchemy + SQLite inicial + React.
- Todas las reglas criticas de montos, pagos y consistencia se validan en backend.
- El modelo de datos y contratos API deben permanecer independientes de formato Excel.
- Todo endpoint opcional de IA debe degradar sin impacto sobre modulo core.
- El despliegue objetivo es LAN local con soporte de 2 equipos y operacion offline.

## Flujo de Entrega y Control de Fases

- Cada `plan.md` MUST incluir un Constitution Check explicito contra los 12 principios.
- Cada `spec.md` MUST declarar modulos impactados, reglas backend y trazabilidad minima.
- Cada `tasks.md` MUST agrupar trabajo por fases y evitar multitarea no esencial.
- Ningun cambio de arquitectura se aprueba sin justificar por que la opcion simple falla.
- Reportes y exportaciones son parte de definicion de terminado cuando la fase lo exija.

## Governance

Esta constitucion prevalece sobre practicas locales que entren en conflicto.
Toda propuesta de cambio MUST incluir:
- principio o seccion afectada,
- razon de negocio,
- impacto en plantillas de especificacion/plan/tareas,
- estrategia de migracion si aplica.

Versionado de la constitucion:
- MAJOR: eliminacion/redefinicion incompatible de principios.
- MINOR: nuevo principio o expansion normativa sustancial.
- PATCH: aclaraciones no normativas ni incompatibles.

Cumplimiento:
- Toda planificacion y revision MUST verificar conformidad explicita.
- Violaciones intencionales MUST registrarse en "Complexity Tracking" del plan.
- Incumplimientos reiterados bloquean avance de fase hasta correccion.

**Version**: 1.0.0 | **Ratified**: 2026-04-23 | **Last Amended**: 2026-04-23
