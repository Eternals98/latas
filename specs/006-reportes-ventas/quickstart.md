# Quickstart: Reportes de Ventas

## Prerequisites

- Backend dependencies installed from `backend/requirements.txt`.
- Database initialized with at least one `Venta` and related `Pago`.
- Current branch: `006-reportes-ventas`.

## Run backend locally

```powershell
cd backend
python -m uvicorn src.api.main:app --reload --host 0.0.0.0 --port 8000
```

Or with Docker Compose from repository root:

```powershell
docker compose up --build backend
```

## Validate monthly list

```powershell
curl "http://localhost:8000/api/ventas?mes=4&anio=2026"
```

Expected:

- HTTP `200`.
- Response contains `mes`, `anio`, `items`, and `resumen_mensual`.
- Every item belongs to April 2026.
- Empty month returns `items: []` with totals at zero.

## Validate invalid period

```powershell
curl "http://localhost:8000/api/ventas?mes=13&anio=2026"
```

Expected:

- HTTP `400`.
- Clear validation message for invalid month.

## Validate formal export

```powershell
curl -L "http://localhost:8000/api/ventas/export?tipo=formal&mes=4&anio=2026" -o ventas-formales-2026-04.xlsx
```

Expected:

- HTTP `200`.
- Header `Content-Type` uses XLSX media type.
- Downloaded file opens in a spreadsheet application.
- Rows include only formal sales for April 2026.

## Validate informal export

```powershell
curl -L "http://localhost:8000/api/ventas/export?tipo=informal&mes=4&anio=2026" -o ventas-informales-2026-04.xlsx
```

Expected:

- HTTP `200`.
- Downloaded file opens in a spreadsheet application.
- Rows include only informal sales for April 2026.

## Validate invalid export type

```powershell
curl "http://localhost:8000/api/ventas/export?tipo=otro"
```

Expected:

- HTTP `400`.
- Clear message that `tipo` must be `formal` or `informal`.

## Test commands

```powershell
cd backend
pytest
```

If frontend report controls are added in tasks:

```powershell
cd frontend
npm run build
```

## Final verification evidence

- Backend report tests: `python -m pytest tests/contract/test_ventas_reportes_contract.py tests/integration/test_ventas_reportes.py tests/unit/test_ventas_reportes_service.py` -> 18 passed.
- Backend full suite: `python -m pytest` -> 55 passed.
- Frontend build: `npm run build` -> passed after installing dependencies with `npm install`.
