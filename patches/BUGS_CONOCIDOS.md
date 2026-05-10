# Bugs en archivos existentes (no cubiertos por este patch)

## components/TransactionsScreen.tsx

### 1. Falta apóstrofe de apertura en 'use client'
```tsx
// ❌ Actual (roto):
use client';

// ✅ Correcto:
'use client';
```

### 2. Badge con prop `label` que no existe — usa `children`
```tsx
// ❌ Actual (roto):
<Badge tone="success" label="Activo" />

// ✅ Correcto:
<Badge variant="success">Activo</Badge>
```

### 3. Iconos `edit` e `inbox` no están en ICON_MAP de Primitives.tsx
Agregar en Primitives.tsx:
```ts
import { Pencil, Inbox } from 'lucide-react';

// En ICON_MAP:
edit:  Pencil,
inbox: Inbox,
```

---

## lib/hooks/useTransactions.ts

### cancelTransaction llama al método correcto pero `backendDelete` no existía
Ahora `lib/backend.ts` exporta `backendDelete`. Actualizar el hook:
```ts
import { backendFetch, backendMutate, backendDelete } from '@/lib/backend';

// En cancelTransaction:
await backendDelete(`/api/transactions/${id}/cancel`);
// O si el backend usa POST para cancelar:
await backendMutate(`/api/transactions/${id}/cancel`, 'POST');
```
