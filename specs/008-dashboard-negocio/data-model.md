# Data Model: Dashboard de Negocio

## Existing Persistent Entities

### Venta

Represents a sale used as the base unit for dashboard totals.

**Relevant fields**:
- `id`: sale identifier for traceability.
- `empresa`: company/commercial grouping.
- `valor_total`: sale amount used for monthly totals, company totals and ticket promedio.
- `estado`: logical status; only `activo` contributes to dashboard indicators.
- `creado_en`: timestamp used to group sales by month.
- `cliente_id`: optional relationship to `Cliente`.

**Validation and rules**:
- `valor_total` must be non-negative.
- `estado = anulado` is excluded from active dashboard indicators.
- Monthly grouping uses `creado_en` month and year.

### Cliente/Empresa

Represents customer context and commercial grouping for dashboard analysis.

**Relevant fields**:
- `Cliente.id`: customer identifier when present.
- `Cliente.nombre`: display name when needed for traceability.
- `Venta.empresa`: required company grouping used by the first dashboard version.

**Validation and rules**:
- Dashboard groups by `Venta.empresa` for consistency with current sale registration.
- Sales without `Cliente` still contribute to company totals through `Venta.empresa`.

### Pago

Represents payment details associated with a sale.

**Relevant fields**:
- `id`: payment identifier.
- `venta_id`: relationship to `Venta`.
- `medio`: payment method name/code captured at sale time.
- `monto`: payment amount.

**Validation and rules**:
- `monto` must be positive.
- Payment method distribution sums `Pago.monto` for payments attached to active sales.
- Mixed-payment sales contribute each payment amount to its own method.

## Dashboard DTOs

### DashboardResponse

Top-level read model returned by the dashboard contract.

**Fields**:
- `ventas_por_mes`: list of `VentasPorMesItem`.
- `ventas_por_empresa`: list of `VentasPorEmpresaItem`.
- `metodos_pago`: list of `MetodoPagoDashboardItem`.
- `ticket_promedio`: decimal string with two decimals.
- `total_ventas`: decimal string with two decimals.
- `total_mes_actual`: decimal string with two decimals for active sales in the current calendar month.
- `cantidad_ventas`: count of active sales included.
- `generado_en`: timestamp for response generation.

### VentasPorMesItem

Monthly aggregate of active sales.

**Fields**:
- `anio`: numeric year.
- `mes`: numeric month, 1-12.
- `periodo`: display key in `YYYY-MM` format.
- `cantidad_ventas`: active sale count for the month.
- `valor_total`: decimal string with two decimals.

### VentasPorEmpresaItem

Aggregate of active sales by company.

**Fields**:
- `empresa`: company code or display key.
- `cantidad_ventas`: active sale count for the company.
- `valor_total`: decimal string with two decimals.

### MetodoPagoDashboardItem

Aggregate of payment amounts by payment method for active sales.

**Fields**:
- `medio`: payment method name/code.
- `cantidad_pagos`: number of payments using this method.
- `valor_total`: decimal string with two decimals.
- `porcentaje`: decimal percentage of total paid amount, rounded for display.

## State Transitions

Dashboard does not change persistent state.

- `Venta.activo` -> included in dashboard calculations.
- `Venta.anulado` -> excluded from dashboard calculations.
- Changes made by sale creation, edit or annulment are reflected in the next dashboard read.
