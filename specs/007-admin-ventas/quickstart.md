# Quickstart: Administracion de Ventas

## Prerequisites

- Backend dependencies installed from `backend/requirements.txt`.
- Local database initialized with at least one active sale.
- Admin credentials and JWT secret configured for the local backend.

## Run Backend

```powershell
cd backend
python -m uvicorn src.api.main:app --reload
```

The API should be available at `http://localhost:8000`.

## 1. Login as Admin

```powershell
$login = Invoke-RestMethod `
  -Method Post `
  -Uri "http://localhost:8000/api/admin/login" `
  -ContentType "application/json" `
  -Body '{"username":"admin","password":"admin-password"}'

$token = $login.access_token
$headers = @{ Authorization = "Bearer $token" }
```

Expected result:
- HTTP 200.
- Response includes `access_token`, `token_type = bearer`, `expires_in = 28800`, and `expires_at`.

## 2. Reject Protected Endpoint Without Token

```powershell
Invoke-RestMethod `
  -Method Delete `
  -Uri "http://localhost:8000/api/ventas/1"
```

Expected result:
- HTTP 401.
- Sale remains unchanged.

## 3. Edit an Active Sale

```powershell
$body = @{
  empresa = "latas_sas"
  tipo = "formal"
  numero_referencia = "FAC-001-CORREGIDA"
  descripcion = "Venta corregida desde administracion"
  valor_total = "150.00"
  cliente_id = $null
  pagos = @(
    @{ medio = "efectivo"; monto = "100.00" },
    @{ medio = "transferencia"; monto = "50.00" }
  )
} | ConvertTo-Json -Depth 5

Invoke-RestMethod `
  -Method Put `
  -Uri "http://localhost:8000/api/ventas/1" `
  -Headers $headers `
  -ContentType "application/json" `
  -Body $body
```

Expected result:
- HTTP 200.
- Response keeps the same `id`.
- Editable fields and pagos reflect the payload.
- `estado` remains `activo`.
- `modificado_en` changes.

## 4. Annul a Sale

```powershell
Invoke-RestMethod `
  -Method Delete `
  -Uri "http://localhost:8000/api/ventas/1" `
  -Headers $headers
```

Expected result:
- HTTP 200.
- Response keeps the same `id`.
- `estado` is `anulado`.
- Sale is not physically deleted.

## 5. Verify Active Reports Exclude Annulled Sale

```powershell
Invoke-RestMethod "http://localhost:8000/api/ventas?mes=4&anio=2026"
```

Expected result:
- The annulled sale does not appear in active monthly results.
- Monthly totals do not include the annulled sale.

## Validation Checklist

- Invalid admin credentials return 401 and no token.
- Expired or malformed tokens return 401 for both protected endpoints.
- Editing an annulled sale returns conflict/error and does not change commercial data.
- Repeating `DELETE /api/ventas/{id}` returns the same final `anulado` state without duplicate records.
- Existing sale creation and report/export endpoints continue to work.
