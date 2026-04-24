# Quickstart: Dashboard de Negocio

## Prerequisites

- Backend dependencies installed from `backend/requirements.txt`.
- Frontend dependencies installed with `npm install` in `frontend/`.
- Local database initialized with at least one active sale for non-empty charts.

## Backend

From `backend/`:

```powershell
pytest tests/unit/test_dashboard_service.py tests/contract/test_dashboard_contract.py tests/integration/test_dashboard_api.py
uvicorn src.api.main:app --reload
```

Validate the contract manually:

```powershell
Invoke-RestMethod http://localhost:8000/api/dashboard
```

Expected behavior:

- Response includes `ventas_por_mes`, `ventas_por_empresa`, `metodos_pago`, `ticket_promedio`, `total_ventas`, `total_mes_actual`, `cantidad_ventas` and `generado_en`.
- Annulled sales do not affect any aggregate.
- Empty active data returns empty arrays and zero totals, not an operational error.

## Frontend

From `frontend/`:

```powershell
npm install recharts
npm run build
npm run dev
```

Open the local Vite URL and verify:

- Dashboard loads without manual export steps.
- Monthly sales, company totals, payment methods and average ticket are visible.
- Empty data state is readable and does not break layout.

## Cross-check

Compare dashboard totals against existing monthly report data for the same active sales:

- `total_ventas` should match the sum of active sale totals.
- `total_mes_actual` should match the sum of active sale totals for the current calendar month.
- Monthly totals should align with `GET /api/ventas?mes=&anio=` for each month.
- Payment method totals should sum payment amounts from active sales only.
