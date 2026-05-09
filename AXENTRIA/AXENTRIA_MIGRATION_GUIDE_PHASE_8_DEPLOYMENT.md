# Axentria Design → Next.js Web
## PHASE 8: Deployment & Production

**Versión:** 1.0  
**Duración:** 1-1.5 horas  
**Objetivo:** Preparar y desplegar la aplicación a producción

---

## 📋 Tabla de Contenidos

1. [Build Optimization](#build-optimization)
2. [Environment Variables](#environment-variables)
3. [Vercel Deployment](#vercel-deployment)
4. [CI/CD Pipeline](#cicd-pipeline)
5. [Monitoring & Logging](#monitoring--logging)
6. [Performance Tuning](#performance-tuning)
7. [Security Checklist](#security-checklist)
8. [Backup & Disaster Recovery](#backup--disaster-recovery)
9. [Post-Deployment Validation](#post-deployment-validation)
10. [Checklist de Phase 8](#checklist)

---

## Build Optimization

### Production Build

```bash
cd web
npm run build        # Compilar para producción
npm run lint         # Verificar código
npm start            # Probar build localmente
```

### next.config.js

**`web/next.config.js`:**

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Optimizaciones
  compress: true,           // Compresión gzip automática
  poweredByHeader: false,   // Ocultar header "X-Powered-By: Next.js"
  reactStrictMode: true,    // Detectar problemas en desarrollo

  // Imágenes
  images: {
    domains: ['supabase-project.supabase.co'],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
  },

  // Rewriting de URLs (BFF pattern)
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: '/api/:path*',
          destination: `${process.env.BACKEND_API_URL}/api/:path*`,
        },
      ],
    };
  },

  // Headers de seguridad
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Content-Security-Policy',
            value:
              "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';",
          },
        ],
      },
    ];
  },

  // Redirects
  async redirects() {
    return [
      {
        source: '/',
        destination: '/login',
        permanent: false,
      },
    ];
  },

  // Webpack
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.optimization.splitChunks.cacheGroups = {
        ...config.optimization.splitChunks.cacheGroups,
        // Mantener librerías en chunks separados
        vendor: {
          test: /node_modules/,
          name: 'vendors',
          priority: 10,
        },
      };
    }
    return config;
  },
};

module.exports = nextConfig;
```

### Análisis de bundle

```bash
# Instalar analizador
npm install --save-dev @next/bundle-analyzer

# Crear análisis
ANALYZE=true npm run build

# Resultado: visualización de qué ocupa espacio en el bundle
```

---

## Environment Variables

### Development (.env.local)

```env
# Frontend
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
NEXT_PUBLIC_USE_SALES_HOOK=true
NEXT_PUBLIC_USE_CASH_HOOK=true
NEXT_PUBLIC_USE_DASHBOARD_HOOK=true
NEXT_PUBLIC_USE_TRANSACTIONS_HOOK=true

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxxx

# Analytics (opcional)
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```

### Staging (.env.staging)

```env
NEXT_PUBLIC_BACKEND_URL=https://api-staging.latas.app
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx-staging.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxxx-staging
```

### Production (.env.production)

```env
# NUNCA guardar variables sensibles en .env
# Usar Vercel Secrets Management en lugar
NEXT_PUBLIC_BACKEND_URL=https://api.latas.app
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxxx
```

### Configurar en Vercel

```bash
# Via CLI
vercel env add NEXT_PUBLIC_BACKEND_URL
# Ingresar: https://api.latas.app

vercel env add NEXT_PUBLIC_SUPABASE_URL
# Ingresar: https://xxxxx.supabase.co

# O via Dashboard:
# Vercel → Configuración → Environment Variables
```

---

## Vercel Deployment

### Conectar repositorio

1. **Crear proyecto en Vercel:**
   - Ir a https://vercel.com/new
   - Seleccionar repositorio GitHub
   - Elegir rama `main`

2. **Configuración del build:**
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Install Command: `npm ci`

3. **Root Directory:**
   - Si Next.js está en `/web`, especificar como root directory

### Deploy automático

```bash
# Cada push a main dispara un deploy
git push origin main

# Vercel:
# 1. Clona el repo
# 2. Ejecuta `npm ci`
# 3. Ejecuta `npm run build`
# 4. Sube archivos a CDN
# 5. Genera URL de preview
```

### Deployments preview

```bash
# Cada PR crea un deploy preview
# PR #123 → https://latas-pr-123.vercel.app

# Merge a main → deploy a producción automáticamente
```

### Dominios personalizados

```
Vercel → Proyecto → Configuración → Dominios
1. Agregar dominio: latas.app
2. Configurar DNS en registrador
3. Verificar ownership
```

---

## CI/CD Pipeline

### GitHub Actions

**`.github/workflows/test-and-deploy.yml`:**

```yaml
name: Test & Deploy

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Lint
        run: npm run lint

      - name: Build
        run: npm run build

      - name: Type check
        run: npx tsc --noEmit

      # Backend tests
      - name: Setup Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'
          cache: 'pip'

      - name: Install backend dependencies
        run: |
          cd backend
          python -m venv .venv
          source .venv/bin/activate
          pip install -r requirements.txt

      - name: Run backend tests
        run: |
          cd backend
          source .venv/bin/activate
          pytest -xvs

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'

    steps:
      - uses: actions/checkout@v3

      - name: Deploy to Vercel
        uses: vercel/action@master
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
```

### GitHub Secrets

```bash
# Agregar en GitHub → Settings → Secrets
VERCEL_TOKEN=<token de Vercel>
VERCEL_ORG_ID=<ID de organización>
VERCEL_PROJECT_ID=<ID del proyecto>
```

### Pre-commit hooks

**`package.json`:**

```json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged"
    }
  },
  "lint-staged": {
    "*.{ts,tsx}": "eslint --fix",
    "*.css": "prettier --write"
  }
}
```

```bash
npm install husky lint-staged --save-dev
npx husky install
```

---

## Monitoring & Logging

### Vercel Analytics

```bash
# En Vercel Dashboard:
# Proyecto → Analíticos
# - Page load times
# - Web Vitals (LCP, FID, CLS)
# - Errores en tiempo real
```

### Sentry Integration

**`lib/sentry.ts`:**

```typescript
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  environment: process.env.NODE_ENV,
  integrations: [new Sentry.Replay()],
  replaySessionSampleRate: 0.1,
  replayOnErrorSampleRate: 1.0,
});
```

**`app/layout.tsx`:**

```typescript
import { Toaster } from 'sonner';
import './globals.css';
import './sentry';

// ... resto del layout
```

### Backend logging

**`backend/.env`:**

```env
LOG_LEVEL=INFO
SENTRY_DSN=https://xxxxxxx@sentry.io/xxxxx
```

**`backend/src/core/logging.py`:**

```python
import logging
import sentry_sdk
from pythonjsonlogger import jsonlogger

# JSON logging para producción
logger = logging.getLogger()
logHandler = logging.StreamHandler()
formatter = jsonlogger.JsonFormatter()
logHandler.setFormatter(formatter)
logger.addHandler(logHandler)

# Sentry
sentry_sdk.init(dsn=os.getenv('SENTRY_DSN'))
```

---

## Performance Tuning

### Image Optimization

**`components/OptimizedImage.tsx`:**

```typescript
import Image from 'next/image';

export const OptimizedImage = ({
  src,
  alt,
  width,
  height,
}: {
  src: string;
  alt: string;
  width: number;
  height: number;
}) => (
  <Image
    src={src}
    alt={alt}
    width={width}
    height={height}
    priority={false}         // Lazy load por defecto
    quality={75}             // Compresión JPEG
    placeholder="blur"       // Mostrar blur mientras carga
    blurDataURL="..."        // URL de imagen pequeña para blur
  />
);
```

### Code Splitting

```typescript
// Lazy load componentes pesados
import dynamic from 'next/dynamic';

const HeavyChart = dynamic(() => import('@/components/HeavyChart'), {
  loading: () => <div className="animate-pulse h-64" />,
});
```

### Caching Strategy

**`next.config.js`:**

```javascript
async headers() {
  return [
    {
      source: '/api/:path*',
      headers: [
        { key: 'Cache-Control', value: 'no-cache, no-store' },
      ],
    },
    {
      source: '/_next/static/:path*',
      headers: [
        { key: 'Cache-Control', value: 'max-age=31536000' },
      ],
    },
  ];
}
```

### Database Connection Pooling

**Backend (`backend/.env`):**

```env
DATABASE_POOL_SIZE=20
DATABASE_POOL_RECYCLE=3600
DATABASE_POOL_PRE_PING=true
```

---

## Security Checklist

### Frontend Security

- [ ] Headers CSP configurados (Content-Security-Policy)
- [ ] HTTPS forzado en producción
- [ ] Cookies con flags Secure + HttpOnly + SameSite
- [ ] CSRF tokens validados en mutaciones
- [ ] Validación input en cliente Y servidor
- [ ] Secrets no hardcodeados en código
- [ ] Dependencias auditadas (`npm audit fix`)
- [ ] No expongan URLs sensibles en logs

### Backend Security

- [ ] JWT validado en cada request
- [ ] RLS policies enforced en Supabase
- [ ] Rate limiting en endpoints públicos
- [ ] Contraseñas hasheadas (bcrypt)
- [ ] SQL injection prevenida (ORM + prepared statements)
- [ ] CORS configurado específicamente
- [ ] Secrets en variables de entorno
- [ ] Logs sin información sensible

### Infrastructure

- [ ] HTTPS en todos los endpoints
- [ ] Backup automático de base de datos
- [ ] Monitoreo de disponibilidad 24/7
- [ ] Alertas en caso de error
- [ ] Rotación de secrets periódicamente
- [ ] Acceso SSH con claves (sin passwords)
- [ ] Firewall configurado

---

## Backup & Disaster Recovery

### Supabase Backups

```
Supabase Dashboard → Configuración → Backups
- Daily automated backups (7 días de retención)
- Point-in-time recovery (24 horas)
- Manual backups antes de cambios importantes
```

### Vercel Backup

```
Vercel maneja automáticamente:
- Deployments historiales (últimos 100)
- Rollback a versión anterior en 1 click
- Estateless (no hay datos locales)
```

### Disaster Recovery Plan

1. **Si el backend está caído:**
   - Notificar usuarios vía banner
   - Mostrar cached data si disponible
   - Redirigir a página de mantenimiento

2. **Si la BD está caída:**
   - Usar Supabase point-in-time recovery
   - Restaurar a últimaversión conocida
   - Verificar integridad de datos

3. **Si frontend está caído:**
   - Vercel rollback a deployrecimario
   - O deploy manual desde GitHub

**`app/maintenance/page.tsx`:**

```typescript
export default function MaintenancePage() {
  return (
    <div className="min-h-screen bg-paper-100 grid place-items-center p-8">
      <div className="text-center max-w-md">
        <Icon name="wrench" size={64} className="text-brass-400 mx-auto mb-4" />
        <h1 className="text-3xl font-display font-bold text-ink-900 mb-2">
          Mantenimiento
        </h1>
        <p className="text-slate-600 mb-4">
          Estamos realizando mantenimiento. Volveremos en breve.
        </p>
        <p className="text-xs text-slate-500">
          Últimas noticias: <a href="#">@latas_status</a>
        </p>
      </div>
    </div>
  );
}
```

---

## Post-Deployment Validation

### Smoke Tests

```bash
# Script: smoke-test.sh

#!/bin/bash

BASE_URL="https://latas.app"

# Test 1: Login
curl -X POST $BASE_URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123"}' \
  -w "Status: %{http_code}\n"

# Test 2: Dashboard
curl $BASE_URL/dashboard \
  -b "auth_token=..." \
  -w "Status: %{http_code}\n"

# Test 3: API Disponible
curl $BASE_URL/api/health \
  -w "Status: %{http_code}\n"

echo "✅ Smoke tests complete"
```

### Monitoring

**Verificar cada 5 minutos:**
- Frontend responde HTTP 200
- API backend disponible
- BD conectada
- Errores en Sentry < 10 por minuto

---

## Deployment Checklist

### Pre-Deployment

- [ ] Todas las pruebas pasan (`npm run build`, `npm test`, `pytest`)
- [ ] Code review aprobado
- [ ] No hay `console.log()` o `debugger` en código
- [ ] Variables de entorno configuradas en Vercel
- [ ] Backup de BD realizado
- [ ] Feature flags en `true` para features nuevas

### Deployment

- [ ] Push a rama `main`
- [ ] GitHub Actions ejecutándose
- [ ] Build completado sin errores
- [ ] Preview deployment funciona
- [ ] Tests pasados

### Post-Deployment

- [ ] Login funciona
- [ ] Dashboard carga métricas
- [ ] Registro de venta funciona end-to-end
- [ ] Caja abre y cierra
- [ ] Historial de transacciones visible
- [ ] Reportes exportan XLSX
- [ ] Mobile responsive funciona
- [ ] No hay errores en Sentry
- [ ] Performance metrics acceptable (LCP < 2.5s)

---

## Versioning & Rollout

### Semantic Versioning

```
v1.0.0 = MAJOR.MINOR.PATCH

MAJOR: Breaking changes (v1 → v2)
MINOR: New features backwards-compatible (v1.0 → v1.1)
PATCH: Bug fixes (v1.0.0 → v1.0.1)
```

### Git Tags

```bash
# Crear tag de versión
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0

# Vercel automáticamente crea release notes
```

### Gradual Rollout

```
Día 1: Deploy a staging
Día 2: Deploy a producción (50% de usuarios)
Día 3: Deploy a producción (100% de usuarios)
```

---

## Final Checklist

- [ ] Todas las 8 phases completadas
- [ ] Build production sin warnings
- [ ] Linting pasa sin errores
- [ ] Tests backend pasan
- [ ] Tests frontend pasan (si existen)
- [ ] Environment variables configuradas
- [ ] Vercel integrado
- [ ] Dominio personalizado configurado
- [ ] HTTPS habilitado
- [ ] Backups automáticos
- [ ] Monitoreo activo
- [ ] Alertas configuradas
- [ ] Documentación actualizada
- [ ] Team capacity informado
- [ ] On-call rotation establecido

---

## Paso a Paso: Tu primer deploy a producción

### 1. Preparar código

```bash
cd web
npm run lint          # Verificar
npm run build         # Compilar
npm run type-check    # Types
npm start             # Probar localmente
```

### 2. Commit y push

```bash
git add .
git commit -m "feat: production-ready build"
git push origin main
```

### 3. Ver deployment en Vercel

```
Vercel Dashboard → Deployments
- En progreso: Compiling
- Listo: Production URL
```

### 4. Validar en vivo

```
1. Visitar https://latas.app/login
2. Ingresar credenciales
3. Navegar: Dashboard, Ventas, Caja, Reportes
4. Revisar Sentry por errores
5. Revisar Analytics: Vitales web
```

### 5. Anunciar

```
Equipo: "✅ v1.0.0 deployed a producción"
- N usuarios activos
- Dashboard carga en X ms
- 0 errores en últimas 5 min
```

---

**Estado:** ✅ Phase 8 Complete — PRODUCTION READY ✨  
**Duración estimada:** 1-1.5 horas  
**Siguiente:** Mantenimiento y mejoras continuas

---

## 🚀 ¡Felicidades!

Has completado exitosamente la migración del **Axentria Design System** a una aplicación **Next.js 14+ moderna y lista para producción**.

### Resumen de lo logrado

✅ **Design System completo**: 6 paletas de color, 3 familias tipográficas, tokens CSS  
✅ **Componentes primitivos**: Button, Input, Card, Icon, Avatar, Badge, Divider, Select  
✅ **Screens complejos**: Login, Sales, Dashboard, Cash, Transactions, Reports  
✅ **Data hooks**: useSales, useCash, useDashboard, useTransactions, useLookupData, useSessionInfo  
✅ **Autenticación**: Login, Registro, JWT, Role-based access control  
✅ **Enrutamiento**: App Router, Protected routes, Mobile drawer, Breadcrumbs  
✅ **Responsiveness**: Mobile, Tablet, Desktop (360-1280px)  
✅ **Producción**: Build optimization, Vercel deployment, CI/CD, Monitoring

### Próximos pasos

1. **Monitoreo**: Revisar Sentry y Analytics diariamente
2. **Feedback de usuarios**: Recopilar issues y feature requests
3. **Optimización**: Análisis de performance y mejoras iterativas
4. **Nuevas features**: Implementar basado en prioridades
5. **Escalado**: Preparar para crecimiento de usuarios

---

**Guía creada:** Mayo 2026  
**Versión:** 1.0.0  
**Licencia:** MIT
