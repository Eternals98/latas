# Quickstart: Gestion de Formas de Pago

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

## 4. Consultar catalogo de medios de pago

```bash
curl http://localhost:8000/api/medios-pago
```

Resultado esperado:
- HTTP 200.
- Lista con 10 medios iniciales.
- Cada item incluye `id`, `codigo`, `nombre`, `activo`, `creado_en`, `modificado_en`.
- Orden deterministico por nombre.

## 5. Validar lista inicial requerida

Verificar que la respuesta incluye:
1. Efectivo
2. Tarjeta Latas
3. Tarjeta Tomas
4. Bancolombia Latas
5. Bancolombia Tomas
6. BBVA Latas
7. BBVA Tomas
8. Nequi
9. Davivienda
10. Otro

## 6. Validacion rapida para frontend

1. Consumir `GET /api/medios-pago` desde cliente.
2. Poblar selector de pagos sin listas hardcodeadas en UI.
3. Confirmar que refrescar la pantalla vuelve a consultar el catalogo y mantiene consistencia.

## 7. Protocolo de medicion de tiempo de seleccion (SC-003 < 5s)

1. Abrir pantalla de venta con selector de medio de pago.
2. Iniciar cronometro al enfocar el selector.
3. Seleccionar un medio de pago y confirmar que queda aplicado en el formulario.
4. Detener cronometro al ver el medio seleccionado en UI.
5. Repetir 10 veces por operador y registrar promedio y maximo.
6. Criterio de aprobacion: promedio < 5 s y maximo < 5 s por operador.

Referencia tecnica local (latencia de API):

```bash
cd backend
python - <<'PY'
import time
from statistics import mean
from fastapi.testclient import TestClient
from src.api.main import app
client = TestClient(app)
durations = []
for _ in range(20):
    t0 = time.perf_counter()
    client.get("/api/medios-pago")
    durations.append((time.perf_counter() - t0) * 1000)
print({"avg_ms": round(mean(durations), 2), "max_ms": round(max(durations), 2)})
PY
```
