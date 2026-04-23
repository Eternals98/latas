# Backend Core - LATAS Ventas

## Entorno local

```bash
python -m venv .venv
# PowerShell
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
```

## Inicializar base de datos

```bash
python -m src.db.init_db
python scripts/check_schema.py
```

## Ejecutar API

```bash
uvicorn src.api.main:app --reload --host 0.0.0.0 --port 8000
```

## Verificar salud

```bash
curl http://localhost:8000/api/health
```

Respuesta esperada:

```json
{"status":"ok"}
```

## Registrar venta con pagos

```bash
curl -X POST http://localhost:8000/api/ventas \
  -H "Content-Type: application/json" \
  -d "{\"empresa\":\"latas_sas\",\"tipo\":\"formal\",\"numero_referencia\":\"V-1001\",\"descripcion\":\"Venta mostrador\",\"valor_total\":\"100000.00\",\"cliente_id\":null,\"pagos\":[{\"medio\":\"efectivo\",\"monto\":\"60000.00\"},{\"medio\":\"transferencia\",\"monto\":\"40000.00\"}]}"
```

Respuesta esperada:
- `201` con venta + pagos creados.

Errores esperados:
- `400` con `{"detail":"La suma de pagos no coincide con valor_total."}` cuando el total no cuadra.
- `400` con `{"detail":"<campo>: Field required"}` en payload incompleto.

## Gestion de clientes

### Crear cliente

```bash
curl -X POST http://localhost:8000/api/clientes \
  -H "Content-Type: application/json" \
  -d "{\"nombre\":\"Comercial Andina SAS\",\"telefono\":\"3001234567\"}"
```

Respuesta esperada:
- `201` con `id`, `nombre`, `telefono`, `creado_en`, `modificado_en`, `estado`.

Errores esperados:
- `400` cuando el payload es invalido.
- `409` cuando el nombre ya existe tras normalizacion (trim + case-insensitive).

### Buscar clientes para autocompletar

```bash
curl "http://localhost:8000/api/clientes?search=andi"
```

Respuesta esperada:
- `200` con lista de coincidencias parciales.
- maximo `10` resultados por consulta.
- orden deterministico por relevancia y nombre ascendente.

## Catalogo de medios de pago

### Consultar catalogo centralizado

```bash
curl http://localhost:8000/api/medios-pago
```

Respuesta esperada:
- `200` con lista de medios activos.
- cada item incluye `id`, `codigo`, `nombre`, `activo`, `creado_en`, `modificado_en`.
- orden deterministico por `nombre` ascendente (desempate por `id`).

Guia para frontend:
- consumir siempre `GET /api/medios-pago` para llenar selectores.
- no mantener listas hardcodeadas en cliente.
- refrescar selector consultando backend para mantener consistencia operativa.

## Ejecutar pruebas

```bash
pytest
```
