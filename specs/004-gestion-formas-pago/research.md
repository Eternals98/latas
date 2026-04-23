# Research: Gestion de Formas de Pago

## Decision 1: Catalogo persistente de medios de pago
- **Decision**: Modelar medios de pago en una entidad persistente `MedioPago` en lugar de lista fija en codigo de frontend.
- **Rationale**: Centraliza la fuente de verdad, evita hardcodeo y habilita evolucion natural a CRUD.
- **Alternatives considered**:
  - Lista hardcodeada en frontend (rechazado: alta probabilidad de desalineacion y mantenimiento duplicado).
  - Constante hardcodeada en backend sin entidad (rechazado: menor trazabilidad y peor camino a CRUD futuro).

## Decision 2: Endpoint de solo lectura en esta fase
- **Decision**: Exponer unicamente `GET /api/medios-pago` para consulta operativa del catalogo.
- **Rationale**: Cumple objetivo actual con alcance controlado y sin adelantar complejidad administrativa.
- **Alternatives considered**:
  - Incluir CRUD completo ahora (rechazado: sobrealcance frente a objetivo del feature).
  - Reusar endpoint de ventas para incrustar catalogo (rechazado: acoplamiento indebido y peor reutilizacion).

## Decision 3: Contrato estable para futura administracion
- **Decision**: Responder cada medio de pago con `id`, `codigo`, `nombre`, `activo`, `creado_en`, `modificado_en`.
- **Rationale**: Asegura identificacion estable y trazabilidad minima para futuras operaciones de administrar catalogo.
- **Alternatives considered**:
  - Retornar solo string de nombre (rechazado: insuficiente para CRUD y baja trazabilidad).
  - Exponer campos internos no necesarios en fase actual (rechazado: ruido de contrato y mayor riesgo de acoplamiento).

## Decision 4: Orden deterministico y filtro por estado
- **Decision**: Listar medios de pago activos con orden deterministico por `nombre` ascendente (y desempate por `id`).
- **Rationale**: Evita variaciones visuales en frontend y soporta experiencia consistente para operadores.
- **Alternatives considered**:
  - Orden de insercion no garantizado (rechazado: resultados inestables entre consultas).
  - Mezclar activos e inactivos en salida (rechazado: aumenta ruido operativo).

## Decision 5: Seed inicial controlado en backend
- **Decision**: Inicializar catalogo con los 10 medios requeridos durante bootstrap de datos.
- **Rationale**: Garantiza disponibilidad inmediata del listado y reduce pasos manuales de despliegue.
- **Alternatives considered**:
  - Carga manual por SQL ad-hoc (rechazado: error-prone y no reproducible).
  - Cargar desde archivo externo editable en runtime (rechazado: complejidad innecesaria en fase actual).

## Decision 6: Frontera de evolucion a CRUD sin exponer escrituras
- **Decision**: Mantener en esta version un servicio de solo lectura + semilla controlada, sin endpoints de alta/edicion/baja.
- **Rationale**: Preserva contrato estable para frontend y minimiza riesgo de cambios operativos sin gobierno del catalogo.
- **Alternatives considered**:
  - Exponer mutaciones parciales ahora (rechazado: aumenta superficie de error y requiere reglas de autorizacion fuera de alcance).

## Execution Notes (2026-04-23)

### T035 - Targeted medios de pago suite
- Command: `python -m pytest backend/tests/unit/test_medios_pago_service.py backend/tests/integration/test_medios_pago_api.py backend/tests/contract/test_medios_pago_contract.py -q`
- Result: `8 passed`.

### T036 - Full backend suite
- Command: `python -m pytest backend/tests -q`
- Result: `36 passed`.

### SC-003 technical baseline (API latency local)
- Sample: 20 requests a `GET /api/medios-pago` con `TestClient`.
- Result: `avg_ms=33.75`, `max_ms=75.80`, `min_ms=23.00`.
- Conclusion: la latencia backend no es cuello de botella para el objetivo `< 5 s`; falta verificacion manual con operadores sobre flujo UI end-to-end.
