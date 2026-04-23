# Research: Gestion de Clientes

## Decision 1: Duplicado exacto con normalizacion de nombre
- **Decision**: Tratar como duplicado exacto cualquier nombre de cliente igual tras `trim` de espacios al inicio/fin y comparacion case-insensitive.
- **Rationale**: Evita duplicados por diferencias cosmeticas y mantiene un maestro de clientes consistente para operacion y reportes.
- **Alternatives considered**:
  - Comparacion literal exacta (rechazado: permite duplicados por mayusculas/espacios).
  - Normalizacion agresiva adicional (tildes/simbolos) (rechazado: riesgo de falsos positivos para nombres distintos).

## Decision 2: Busqueda parcial orientada a autocomplete
- **Decision**: Implementar busqueda por coincidencia parcial en nombre y limitar resultados a `top 10`.
- **Rationale**: Responde al flujo de autocompletado con latencia baja y volumen controlado de resultados.
- **Alternatives considered**:
  - Busqueda exacta solamente (rechazado: no sirve para autocompletado incremental).
  - Sin limite de resultados (rechazado: degrada usabilidad y rendimiento en listas grandes).

## Decision 3: Regla de unicidad en backend con respaldo en persistencia
- **Decision**: Validar no-duplicidad en servicio backend y reforzar con restriccion de unicidad sobre nombre normalizado en base de datos.
- **Rationale**: La validacion de negocio da mensajes claros; la restriccion de persistencia protege de condiciones de carrera.
- **Alternatives considered**:
  - Solo validacion previa en aplicacion (rechazado: vulnerable a concurrencia).
  - Solo constraint de base de datos (rechazado: menos control del mensaje funcional).

## Decision 4: Contrato API explicito para GET/POST de clientes
- **Decision**: Definir contrato OpenAPI para `GET /api/clientes?search=texto` y `POST /api/clientes`, incluyendo escenarios de error por duplicado.
- **Rationale**: Permite implementar frontend de autocomplete con integracion predecible y facilita pruebas de contrato.
- **Alternatives considered**:
  - Contrato implícito solo por codigo (rechazado: menor trazabilidad funcional).
  - Documentacion narrativa sin schemas (rechazado: dificulta validacion automatizada).

## Decision 5: Pruebas enfocadas a flujo critico de clientes
- **Decision**: Cubrir busqueda parcial limitada, creacion exitosa y rechazo de duplicado exacto como conjunto minimo.
- **Rationale**: Protege el comportamiento core sin dispersar esfuerzo en funcionalidades fuera de alcance.
- **Alternatives considered**:
  - Cobertura de CRUD completo (rechazado: sobrealcance de fase).
  - Solo pruebas manuales (rechazado: alto riesgo de regresion).

## Execution Notes (2026-04-23)

- Se implemento el modulo `Clientes` en backend: rutas (`GET /api/clientes`, `POST /api/clientes`), schemas y servicio.
- Se agrego normalizacion por `trim + lowercase` para busqueda y control de duplicado exacto.
- Se actualizo el modelo `Cliente` con `nombre_normalizado` unico, `estado` y `modificado_en`.
- Se incorporaron pruebas unitarias, de integracion, contrato y rendimiento para clientes.
- Resultado de pruebas: `python -m pytest` en `backend` -> **28 passed**.
