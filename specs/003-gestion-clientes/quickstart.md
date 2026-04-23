# Quickstart: Gestion de Clientes

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

## 4. Crear cliente nuevo

```bash
curl -X POST http://localhost:8000/api/clientes \
  -H "Content-Type: application/json" \
  -d "{\"nombre\":\"Comercial Andina SAS\",\"telefono\":\"3001234567\"}"
```

Resultado esperado:
- HTTP 201
- Cuerpo con `id`, `nombre`, `telefono`, `creado_en`, `modificado_en`, `estado`.

## 5. Buscar cliente por coincidencia parcial (autocomplete)

```bash
curl "http://localhost:8000/api/clientes?search=andi"
```

Resultado esperado:
- HTTP 200
- Lista de clientes coincidentes, maximo 10 resultados, con orden deterministico.
- Si `search` llega vacio o con solo espacios, respuesta `[]`.

## 6. Validar rechazo por duplicado exacto

```bash
curl -X POST http://localhost:8000/api/clientes \
  -H "Content-Type: application/json" \
  -d "{\"nombre\":\"  comercial andina sas  \",\"telefono\":\"3009999999\"}"
```

Resultado esperado:
- HTTP 409 (o codigo de conflicto definido por contrato)
- Mensaje indicando cliente duplicado exacto.

## 7. Validacion rapida end-to-end

1. Crear cliente con `POST /api/clientes`.
2. Buscar con `GET /api/clientes?search=<fragmento>` y confirmar que aparece.
3. Repetir creacion con mismo nombre normalizado y confirmar `409`.
