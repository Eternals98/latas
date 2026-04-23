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
