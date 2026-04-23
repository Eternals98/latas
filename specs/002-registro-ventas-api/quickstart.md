# Quickstart: Registro de Ventas API

## 1. Preparar entorno backend

```bash
cd backend
python -m venv .venv
# PowerShell
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
python -m src.db.init_db
```

## 2. Ejecutar API

```bash
uvicorn src.api.main:app --reload --host 0.0.0.0 --port 8000
```

## 3. Verificar health

```bash
curl http://localhost:8000/api/health
```

Respuesta esperada:

```json
{"status":"ok"}
```

## 4. Crear venta valida (multi-pago)

```bash
curl -X POST http://localhost:8000/api/ventas \
  -H "Content-Type: application/json" \
  -d "{\"empresa\":\"latas_sas\",\"tipo\":\"formal\",\"numero_referencia\":\"V-1001\",\"descripcion\":\"Venta mostrador\",\"valor_total\":\"100000.00\",\"cliente_id\":null,\"pagos\":[{\"medio\":\"efectivo\",\"monto\":\"60000.00\"},{\"medio\":\"transferencia\",\"monto\":\"40000.00\"}]}"
```

Resultado esperado:
- HTTP 201
- Cuerpo con venta creada y arreglo `pagos` con dos registros.

## 5. Validar error por suma invalida

```bash
curl -X POST http://localhost:8000/api/ventas \
  -H "Content-Type: application/json" \
  -d "{\"empresa\":\"latas_sas\",\"tipo\":\"formal\",\"numero_referencia\":\"V-1002\",\"descripcion\":\"Venta invalida\",\"valor_total\":\"100000.00\",\"pagos\":[{\"medio\":\"efectivo\",\"monto\":\"90000.00\"}]}"
```

Resultado esperado:
- HTTP 400
- Mensaje:

```json
{"detail":"La suma de pagos no coincide con valor_total."}
```

## 6. Validar error por request incompleto

```bash
curl -X POST http://localhost:8000/api/ventas \
  -H "Content-Type: application/json" \
  -d "{\"numero_referencia\":\"V-1003\",\"descripcion\":\"Sin empresa ni tipo\",\"valor_total\":\"1000.00\",\"pagos\":[]}"
```

Resultado esperado:
- HTTP 400
- Mensaje similar a:

```json
{"detail":"empresa: Field required"}
```
