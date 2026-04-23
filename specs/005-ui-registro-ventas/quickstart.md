# Quickstart: UI Registro de Ventas

## 1. Preparar backend

```bash
cd backend
python -m venv .venv
# PowerShell
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
python -m src.db.init_db
uvicorn src.api.main:app --reload --host 0.0.0.0 --port 8000
```

## 2. Verificar endpoints base para la UI

```bash
curl http://localhost:8000/api/health
curl http://localhost:8000/api/medios-pago
curl "http://localhost:8000/api/clientes?search="
```

Resultado esperado:
- `health` responde `{"status":"ok"}`.
- `medios-pago` retorna lista activa con `id/codigo/nombre`.
- `clientes` responde arreglo JSON (vacio o con resultados).

## 3. Preparar frontend (React + Vite + Tailwind)

```bash
# desde la raiz del repo
npm create vite@latest frontend -- --template react-ts
cd frontend
npm install
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

Configurar `VITE_API_URL=http://localhost:8000` en `.env` del frontend.

## 4. Ejecutar frontend

```bash
cd frontend
npm run dev
```

Abrir la URL local de Vite y navegar a la pantalla `Registro de Ventas`.

## 5. Flujo funcional minimo

1. Seleccionar `Empresa` y `Tipo`.
2. Escribir referencia y descripcion.
3. Buscar cliente por autocomplete y seleccionarlo.
4. Confirmar autocompletado de telefono.
5. Ingresar `Valor total`.
6. Agregar/editar/eliminar filas de pago hasta cuadrar total.
7. Confirmar que el indicador visual pase de `error` a `OK`.
8. Enviar formulario y validar respuesta `201`.

## 6. Casos de validacion rapida

- Enviar con pagos que no cuadran: UI debe bloquear y mostrar error.
- Corregir monto para cuadrar: UI debe mostrar estado `OK` sin recargar pantalla.
- Eliminar una fila intermedia: tabla debe recalcular suma y mantener datos restantes.
- Cliente sin telefono: campo telefono queda vacio, visible y editable.

## 7. Verificacion de contrato POST /api/ventas

```bash
curl -X POST http://localhost:8000/api/ventas \
  -H "Content-Type: application/json" \
  -d "{\"empresa\":\"latas_sas\",\"tipo\":\"formal\",\"numero_referencia\":\"UI-0001\",\"descripcion\":\"Venta UI\",\"valor_total\":\"100000.00\",\"cliente_id\":null,\"pagos\":[{\"medio\":\"efectivo\",\"monto\":\"100000.00\"}]}"
```

Esperado:
- `201` con payload de venta creada.
- Si no cuadra suma de pagos, `400` con `La suma de pagos no coincide con valor_total.`

## 8. Evidencia medible SC-001, SC-002 y SC-003

Fecha de ejecucion:
- UTC: `2026-04-23T21:22:52Z`
- America/Bogota: `2026-04-23 16:22:52 -05:00`

Entorno:
- Ejecucion reproducible con `fastapi.testclient.TestClient` sobre `backend/src/api/main.py`.
- Base de datos local SQLite (`ventas.db`).

### Protocolo ejecutado

1. SC-001: 20 sesiones simuladas de registro valido (1 pago), midiendo tiempo por envio (`POST /api/ventas`) y evaluando umbral `< 120s`.
2. SC-003: 30 ventas mixtas (2 medios de pago) en primer intento, sin correccion.
3. SC-002: 10 casos con cuadre correcto + 10 casos con no-cuadre para validar bloqueo y mensaje de error.

### Resultados

| Criterio | Objetivo | Resultado | Estado |
|---|---|---|---|
| SC-001 | >=95% en <2 min | 20/20 (100.0%) bajo 120s; avg `43.50 ms` (min `29.14`, max `91.28`) | PASS |
| SC-003 | >=90% ventas mixtas sin correccion | 30/30 (100.0%) registradas al primer intento (`201`) | PASS |
| SC-002 | 100% ventas confirmadas con cuadre exacto | Cuadre: 10/10 `201`; No-cuadre: 10/10 bloqueadas `400` con detalle esperado | PASS |

### Evidencia detallada (resumen)

- SC-001:
  - `sessions=20`
  - `accepted_201=20`
  - `under_120s=20`
  - `under_120s_rate=100.0%`
- SC-003:
  - `mixed_sales_total=30`
  - `first_try_201=30`
  - `first_try_rate=100.0%`
- SC-002:
  - `balanced_cases=10`, `balanced_201=10`
  - `unbalanced_cases=10`, `unbalanced_blocked_400=10`
  - `unbalanced_expected_detail=10`
