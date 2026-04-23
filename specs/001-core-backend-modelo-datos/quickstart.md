# Quickstart: Core Backend y Modelo de Datos

## 1. Prerrequisitos

- Python 3.12+
- Docker (opcional para validación de base Compose)

## 2. Crear entorno e instalar dependencias

```bash
cd backend
python -m venv .venv
# Windows PowerShell
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
```

## 3. Inicializar base de datos (fase 1)

```bash
python -m src.db.init_db
python scripts/check_schema.py
```

Resultado esperado:
- Base SQLite creada (si no existe)
- Tablas `cliente`, `venta`, `pago` creadas

## 4. Ejecutar API

```bash
uvicorn src.api.main:app --reload --host 0.0.0.0 --port 8000
```

## 5. Verificar health check

```bash
curl http://localhost:8000/api/health
```

Respuesta esperada:

```json
{
  "status": "ok"
}
```

## 6. Validaciones estructurales y pruebas

```bash
python scripts/validate_relations.py
python scripts/validate_multi_pago.py
pytest
```

## 7. Base Docker Compose (preparación)

```bash
docker compose config
```

Resultado esperado:
- Validación sintáctica correcta de `docker-compose.yml`
- Servicio `backend` declarado para evolución en fases posteriores
