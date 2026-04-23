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

## Ejecutar pruebas

```bash
pytest
```
