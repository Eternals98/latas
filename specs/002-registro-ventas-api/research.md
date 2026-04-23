# Research: Registro de Ventas API

## Decision 1: Validacion de suma de pagos con precision decimal estricta
- **Decision**: Comparar `valor_total` contra la suma de `pagos[].monto` usando precision decimal monetaria y exactitud a 2 decimales.
- **Rationale**: Evita errores de redondeo binario y cumple la regla de negocio de igualdad exacta.
- **Alternatives considered**:
  - Flotantes nativos (`float`) (rechazado: riesgo de precision y falsos positivos/negativos).
  - Tolerancia automatica de diferencia (rechazado: no cumple requerimiento de igualdad exacta).

## Decision 2: Aplicar transaccion atomica en una sola unidad de trabajo
- **Decision**: Persistir venta y pagos en una unica transaccion con rollback completo ante cualquier fallo.
- **Rationale**: Garantiza integridad y evita ventas huerfanas o pagos parciales.
- **Alternatives considered**:
  - Crear venta y pagos en operaciones separadas (rechazado: produce estados inconsistentes).
  - Reintentos parciales automaticos (rechazado: agrega complejidad innecesaria para fase actual).

## Decision 3: Mantener validaciones de entrada en capa API + servicio
- **Decision**: Validar campos obligatorios y existencia de pagos en request schema y reforzar regla de total en servicio de negocio.
- **Rationale**: Entrega errores 400 claros y conserva backend como fuente unica de verdad.
- **Alternatives considered**:
  - Validar solo en frontend (rechazado: viola principio constitucional de backend-truth).
  - Validar solo en DB con constraints avanzados (rechazado: mensaje de error menos controlado y menor claridad operativa).

## Decision 4: Contrato OpenAPI explicito para exito y errores esperados
- **Decision**: Definir schemas de request/response para `POST /api/ventas` y errores 400 estructurados.
- **Rationale**: Facilita implementacion consistente, pruebas y uso manual por curl.
- **Alternatives considered**:
  - Contrato implicito solo por codigo (rechazado: reduce trazabilidad de alcance y QA).
  - Documentacion narrativa sin schema formal (rechazado: no valida estructuras de payload).

## Decision 5: Pruebas de foco unico para flujo core y errores criticos
- **Decision**: Cubrir al menos 3 escenarios: exito multi-pago, suma invalida, request incompleto/sin pagos.
- **Rationale**: Asegura comportamiento minimo requerido sin dispersar el esfuerzo fuera del feature.
- **Alternatives considered**:
  - Cobertura extensa de escenarios no solicitados (rechazado: sobrealcance).
  - Sin pruebas automatizadas (rechazado: alto riesgo de regresion).

## Execution Notes (2026-04-23)

- Command: `python -m pytest -q` (run from `backend/`)
- Result: `15 passed, 28 warnings`
- Coverage focus achieved:
  - Integracion `POST /api/ventas` exito con multiples pagos.
  - Integracion de error 400 por descuadre entre `valor_total` y suma de pagos.
  - Integracion de error 400 por payload incompleto y lista de pagos vacia.
  - Pruebas unitarias de validaciones de monto/total.
  - Smoke de contrato OpenAPI para `POST /api/ventas`.
  - Smoke de performance local (< 1s) para payload de 5 pagos.
