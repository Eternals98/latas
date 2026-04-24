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

## Variables administrativas

Configurar en `.env` para habilitar login y operaciones protegidas:

```env
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin-password
ADMIN_JWT_SECRET=change-this-secret
ADMIN_JWT_ALGORITHM=HS256
ADMIN_JWT_TTL_SECONDS=28800
```

`ADMIN_JWT_TTL_SECONDS=28800` equivale a 8 horas. Cambiar `ADMIN_JWT_SECRET` y
`ADMIN_PASSWORD` en cualquier entorno compartido.

## Verificar salud

```bash
curl http://localhost:8000/api/health
```

Respuesta esperada:

```json
{"status":"ok"}
```

## Registrar venta con pagos

```bash
curl -X POST http://localhost:8000/api/ventas \
  -H "Content-Type: application/json" \
  -d "{\"empresa\":\"latas_sas\",\"tipo\":\"formal\",\"numero_referencia\":\"V-1001\",\"descripcion\":\"Venta mostrador\",\"valor_total\":\"100000.00\",\"cliente_id\":null,\"pagos\":[{\"medio\":\"efectivo\",\"monto\":\"60000.00\"},{\"medio\":\"transferencia\",\"monto\":\"40000.00\"}]}"
```

Respuesta esperada:
- `201` con venta + pagos creados.

Errores esperados:
- `400` con `{"detail":"La suma de pagos no coincide con valor_total."}` cuando el total no cuadra.
- `400` con `{"detail":"<campo>: Field required"}` en payload incompleto.

## Reportes de ventas

### Consultar ventas activas por mes

```bash
curl "http://localhost:8000/api/ventas?mes=4&anio=2026"
```

Respuesta esperada:
- `200` con `mes`, `anio`, `items` y `resumen_mensual`.
- Solo incluye ventas con `estado=activo` creadas dentro del mes solicitado.
- `resumen_mensual.valor_total` se serializa como decimal con dos cifras.

Errores esperados:
- `400` cuando falta `mes` o `anio`.
- `400` cuando `mes` esta fuera de `1..12` o `anio` es menor a `2000`.

### Exportar ventas a XLSX

```bash
curl -L "http://localhost:8000/api/ventas/export?tipo=formal&mes=4&anio=2026" -o ventas-formal-2026-04.xlsx
curl -L "http://localhost:8000/api/ventas/export?tipo=informal&mes=4&anio=2026" -o ventas-informal-2026-04.xlsx
```

Respuesta esperada:
- `200` con `Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`.
- Archivo con encabezados simples y filas filtradas por `tipo`.
- Si no hay coincidencias, se genera un XLSX valido solo con encabezados.

Errores esperados:
- `400` cuando `tipo` no es `formal` o `informal`.
- `400` cuando se envia solo uno de `mes` o `anio`.

## Gestion de clientes

### Crear cliente

```bash
curl -X POST http://localhost:8000/api/clientes \
  -H "Content-Type: application/json" \
  -d "{\"nombre\":\"Comercial Andina SAS\",\"telefono\":\"3001234567\"}"
```

Respuesta esperada:
- `201` con `id`, `nombre`, `telefono`, `creado_en`, `modificado_en`, `estado`.

Errores esperados:
- `400` cuando el payload es invalido.
- `409` cuando el nombre ya existe tras normalizacion (trim + case-insensitive).

### Buscar clientes para autocompletar

```bash
curl "http://localhost:8000/api/clientes?search=andi"
```

Respuesta esperada:
- `200` con lista de coincidencias parciales.
- maximo `10` resultados por consulta.
- orden deterministico por relevancia y nombre ascendente.

## Catalogo de medios de pago

### Consultar catalogo centralizado

```bash
curl http://localhost:8000/api/medios-pago
```

Respuesta esperada:
- `200` con lista de medios activos.
- cada item incluye `id`, `codigo`, `nombre`, `activo`, `creado_en`, `modificado_en`.
- orden deterministico por `nombre` ascendente (desempate por `id`).

Guia para frontend:
- consumir siempre `GET /api/medios-pago` para llenar selectores.
- no mantener listas hardcodeadas en cliente.
- refrescar selector consultando backend para mantener consistencia operativa.

## Flujo UI Registro de Ventas

### Levantar frontend

```bash
cd ../frontend
npm install
copy .env.example .env
npm run dev
```

### Operacion rapida de registro

1. Seleccionar `Empresa` y `Tipo`.
2. Ingresar `Numero referencia`, `Descripcion` y `Valor total`.
3. Buscar cliente por nombre en el campo de autocomplete (2+ caracteres).
4. Confirmar telefono autocompletado (editable).
5. Agregar/editar filas en tabla de pagos.
6. Verificar indicador de cuadre:
   - `Cuadre OK` para habilitar guardado.
   - `Descuadre detectado` cuando pagos != total.
7. Guardar venta y validar mensaje de exito.

### Validaciones operativas

- El boton `Guardar venta` permanece deshabilitado si faltan campos obligatorios.
- El boton `Guardar venta` permanece deshabilitado cuando pagos y total no cuadran.
- Errores del backend (`400`) se muestran al usuario en la pantalla sin perder datos de captura.

## Ejecutar pruebas

```bash
pytest
```
