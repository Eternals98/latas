# Research: UI Registro de Ventas

## Decision 1: Reutilizar API existente para evitar sobrealcance
- **Decision**: Consumir `GET /api/clientes`, `GET /api/medios-pago` y `POST /api/ventas` sin crear nuevos endpoints en esta fase.
- **Rationale**: Los contratos actuales cubren el flujo requerido y mantienen simplicidad de entrega.
- **Alternatives considered**:
  - Crear endpoint agregado para la pantalla (rechazado: acopla en exceso y aumenta mantenimiento).
  - Duplicar reglas en frontend sin enviar al backend (rechazado: rompe principio backend-truth).

## Decision 2: Fuente de opciones para Empresa y Tipo
- **Decision**: Usar listas de opciones alineadas con enums de backend (`latas_sas`, `tomas_gomez`, `formal`, `informal`) dentro de un modulo de configuracion frontend del dominio ventas.
- **Rationale**: El backend ya valida esos valores y no existe endpoint de catalogo para estos campos en alcance actual.
- **Alternatives considered**:
  - Campos de texto libre (rechazado: baja calidad de dato y mayor tasa de error).
  - Nuevo endpoint de catalogos generales (rechazado: fuera de alcance del feature).

## Decision 3: Validacion dual de montos (UX + backend)
- **Decision**: Validar en cliente la igualdad exacta entre suma de pagos y total, manteniendo validacion autoritativa en backend al enviar.
- **Rationale**: Mejora velocidad de correccion en UI y mantiene consistencia transaccional.
- **Alternatives considered**:
  - Validar solo al enviar (rechazado: feedback tardio y mas friccion).
  - Validar solo en cliente (rechazado: riesgo de inconsistencia y bypass).

## Decision 4: Modelo de estado de formulario orientado a productividad
- **Decision**: Gestionar estado con un hook de formulario unico que concentre campos base, filas de pago, errores y estado de cuadre.
- **Rationale**: Reduce acoplamiento entre componentes y evita desincronizacion de tabla dinamica.
- **Alternatives considered**:
  - Estado separado por componente sin coordinador (rechazado: mayor complejidad de sincronizacion).
  - Estado global para toda la app (rechazado: innecesario para una sola vista).

## Decision 5: Estrategia de autocomplete de clientes
- **Decision**: Disparar busqueda de clientes por texto con umbral minimo (2+ caracteres), limitando resultados a los retornados por backend.
- **Rationale**: Equilibra velocidad percibida y ruido de resultados.
- **Alternatives considered**:
  - Cargar todos los clientes al iniciar (rechazado: no escala y ralentiza carga).
  - Requerir busqueda manual externa antes de registrar venta (rechazado: rompe flujo rapido).

## Decision 6: Manejo de telefono autocompletado
- **Decision**: Al seleccionar cliente, llenar telefono automaticamente; si viene nulo, dejar campo vacio visible y editable.
- **Rationale**: Mantiene continuidad operativa sin bloquear venta por dato opcional faltante.
- **Alternatives considered**:
  - Bloquear envio sin telefono (rechazado: no esta exigido por reglas actuales).
  - Ocultar telefono si no existe (rechazado: reduce transparencia para el operador).
