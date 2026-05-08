# Axentria Design → Next.js Web
## PHASE 1: Project Setup & Architecture

**Versión:** 1.0  
**Fecha:** Mayo 2026  
**Objetivo:** Configurar la estructura base del proyecto Next.js con todas las herramientas necesarias

---

## 📋 Tabla de Contenidos

1. [Requisitos previos](#requisitos-previos)
2. [Crear proyecto Next.js](#crear-proyecto-nextjs)
3. [Estructura de directorios](#estructura-de-directorios)
4. [Dependencias necesarias](#dependencias-necesarias)
5. [Configuración de herramientas](#configuración-de-herramientas)
6. [Variables de entorno](#variables-de-entorno)
7. [Checklist de Phase 1](#checklist)

---

## Requisitos Previos

### Tecnologías requeridas
```
Node.js: 18.17+ (preferentemente 20.x LTS)
npm: 9.0+
git: 2.30+
```

### Conocimientos esperados
- React 18+
- Next.js 14+ (App Router)
- Tailwind CSS
- TypeScript
- CSS variables y temas

### Verificar instalaciones
```bash
node --version      # v20.x.x
npm --version       # 9.x.x
npx --version       # 9.x.x
```

---

## Crear proyecto Next.js

### Opción 1: create-next-app (recomendado)
```bash
npx create-next-app@latest latas-web \
  --typescript \
  --tailwind \
  --app \
  --no-src-dir \
  --import-alias '@/*' \
  --eslint
```

**Respuestas recomendadas:**
```
✔ Would you like to use TypeScript? › Yes
✔ Would you like to use ESLint? › Yes
✔ Would you like to use Tailwind CSS? › Yes
✔ Would you like your code inside a `src/` directory? › No
✔ Would you like to use App Router? › Yes
✔ Would you like to use Turbopack (beta)? › No
✔ Would you like to use strict mode in TypeScript? › Yes
✔ What import alias would you like configured? › @/*
```

### Opción 2: Manual (si necesitas control total)
```bash
mkdir latas-web
cd latas-web
npm init -y

# Instalar dependencias core
npm install next@latest react@latest react-dom@latest
npm install -D typescript @types/react @types/node

# Instalar Tailwind
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# Crear estructura básica
mkdir -p app lib components public/fonts
```

---

## Estructura de Directorios

```
latas-web/
├── app/
│   ├── layout.tsx              # Root layout (HTML shell)
│   ├── page.tsx                # Home/redirect
│   ├── globals.css             # CSS variables y fuentes
│   │
│   ├── login/
│   │   └── page.tsx            # Login page
│   │
│   ├── registro/
│   │   └── page.tsx            # Register page
│   │
│   ├── dashboard/
│   │   └── page.tsx            # Admin dashboard
│   │
│   ├── salesRegister/
│   │   └── page.tsx            # Sales form
│   │
│   ├── cash-management/
│   │   └── page.tsx            # Cash sessions
│   │
│   ├── transactions/
│   │   └── page.tsx            # Transaction history
│   │
│   ├── reportes/
│   │   └── page.tsx            # Reports & export
│   │
│   ├── api/
│   │   ├── auth/
│   │   │   ├── login/route.ts
│   │   │   ├── logout/route.ts
│   │   │   ├── register/route.ts
│   │   │   └── session/route.ts
│   │   │
│   │   └── bff/                # Backend-for-Frontend proxy
│   │       ├── companies/route.ts
│   │       ├── customers/route.ts
│   │       ├── payment-methods/route.ts
│   │       ├── sales/route.ts
│   │       └── ...
│   │
│   └── AppShell.tsx            # Shell/layout con sidebar y topbar
│
├── components/
│   ├── Primitives.tsx          # Componentes base (Button, Input, etc)
│   ├── Shell.tsx               # Sidebar + Topbar layout
│   ├── LoginScreen.tsx         # Login form completo
│   ├── DashboardScreen.tsx     # Dashboard layout
│   ├── SaleScreen.tsx          # Sales form
│   ├── CashScreen.tsx          # Cash management
│   ├── TransactionsScreen.tsx  # Transactions table
│   ├── ReportsScreen.tsx       # Reports layout
│   ├── MobileNav.tsx           # Mobile drawer navigation
│   └── ...
│
├── lib/
│   ├── auth.ts                 # Auth utilities
│   ├── session.ts              # Session management
│   ├── csrf-client.ts          # CSRF token helpers
│   ├── backend.ts              # Backend API client
│   ├── feature-flags.ts        # Feature flags
│   ├── validation.ts           # Zod schemas
│   │
│   ├── hooks/
│   │   ├── useSales.ts         # Sales data hook
│   │   ├── useCash.ts          # Cash session hook
│   │   ├── useDashboard.ts     # Dashboard data hook
│   │   ├── useTransactions.ts  # Transactions hook
│   │   ├── useLookupData.ts    # Catalogs (companies, customers, etc)
│   │   ├── useSessionInfo.ts   # User profile hook
│   │   └── ...
│   │
│   ├── utils/
│   │   ├── format.ts           # Number, currency, date formatting
│   │   ├── cn.ts               # Class name merger
│   │   └── ...
│   │
│   └── types/
│       ├── auth.ts
│       ├── sales.ts
│       ├── cash.ts
│       ├── ...
│
├── public/
│   ├── fonts/
│   │   ├── InstrumentSerif-Regular.ttf
│   │   ├── InstrumentSerif-Italic.ttf
│   │   ├── Manrope-VariableFont_wght.ttf
│   │   ├── JetBrainsMono-VariableFont_wght.ttf
│   │   └── JetBrainsMono-Italic-VariableFont_wght.ttf
│   │
│   └── assets/
│       ├── logo-mark.svg
│       ├── logo-full.svg
│       └── ...
│
├── .env.local                  # Local environment variables
├── .env.example                # Template de variables
├── .eslintrc.json              # ESLint config
├── tailwind.config.ts          # Tailwind configuration
├── tsconfig.json               # TypeScript configuration
├── next.config.js              # Next.js configuration
├── postcss.config.js           # PostCSS configuration
│
└── package.json
```

### Crear estructura (si usaste Opción 2)
```bash
# Crear directorios
mkdir -p app/{login,registro,dashboard,salesRegister,cash-management,transactions,reportes,api}
mkdir -p app/api/{auth,bff}
mkdir -p components lib/hooks lib/utils lib/types
mkdir -p public/fonts public/assets

# Crear archivos básicos
touch app/layout.tsx app/page.tsx app/globals.css
touch app/api/auth/route.ts
touch components/Primitives.tsx
touch lib/auth.ts
touch .env.local
```

---

## Dependencias Necesarias

### Instalar todas a la vez
```bash
npm install \
  sonner \
  zod \
  clsx \
  tailwind-merge \
  jose \
  next-themes \
  axios

npm install -D \
  @types/node \
  @types/react \
  @types/react-dom \
  typescript \
  tailwindcss \
  postcss \
  autoprefixer \
  eslint \
  eslint-config-next
```

### Explicación de cada dependencia

| Paquete | Versión | Propósito |
|---------|---------|-----------|
| **sonner** | ^1.2.0 | Toast notifications (notificaciones) |
| **zod** | ^3.22.0 | Schema validation (validación de datos) |
| **clsx** | ^2.0.0 | Class name conditionals |
| **tailwind-merge** | ^2.2.0 | Merge Tailwind classes |
| **jose** | ^5.0.0 | JWT handling (tokens) |
| **next-themes** | ^0.2.1 | Dark mode toggle (opcional) |
| **axios** | ^1.6.0 | HTTP client (alternativa a fetch) |
| **lucide-react** | ^0.292.0 | Icons (instalar después) |
| **recharts** | ^2.10.0 | Charts (para dashboard) |

### Instalar después
```bash
npm install lucide-react recharts
```

---

## Configuración de Herramientas

### 1. TypeScript Config (`tsconfig.json`)

Next.js genera uno automático, pero verifica que tenga:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "jsx": "preserve",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "allowImportingTsExtensions": true,
    "strict": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules"]
}
```

### 2. Tailwind Config (`tailwind.config.ts`)

```typescript
import type { Config } from "tailwindcss";

export default {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./lib/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Axentria palette (se definirán en globals.css como variables CSS)
        ink: {
          950: "var(--ink-950)",
          900: "var(--ink-900)",
          800: "var(--ink-800)",
          700: "var(--ink-700)",
          600: "var(--ink-600)",
          500: "var(--ink-500)",
        },
        paper: {
          50: "var(--paper-50)",
          100: "var(--paper-100)",
          200: "var(--paper-200)",
          300: "var(--paper-300)",
        },
        brass: {
          50: "var(--brass-50)",
          100: "var(--brass-100)",
          200: "var(--brass-200)",
          300: "var(--brass-300)",
          400: "var(--brass-400)",
          500: "var(--brass-500)",
          600: "var(--brass-600)",
          700: "var(--brass-700)",
        },
        sage: {
          50: "var(--sage-50)",
          100: "var(--sage-100)",
          300: "var(--sage-300)",
          500: "var(--sage-500)",
          600: "var(--sage-600)",
          700: "var(--sage-700)",
        },
        coral: {
          50: "var(--coral-50)",
          100: "var(--coral-100)",
          300: "var(--coral-300)",
          500: "var(--coral-500)",
          600: "var(--coral-600)",
          700: "var(--coral-700)",
        },
        slate: {
          50: "var(--slate-50)",
          100: "var(--slate-100)",
          200: "var(--slate-200)",
          300: "var(--slate-300)",
          400: "var(--slate-400)",
          500: "var(--slate-500)",
          600: "var(--slate-600)",
          700: "var(--slate-700)",
          800: "var(--slate-800)",
          900: "var(--slate-900)",
        },
      },
      fontFamily: {
        sans: "var(--font-sans, system-ui)",
        display: "var(--font-display, serif)",
        mono: "var(--font-mono, monospace)",
      },
      spacing: {
        0: "var(--space-0, 0)",
        1: "var(--space-1, 4px)",
        2: "var(--space-2, 8px)",
        3: "var(--space-3, 12px)",
        4: "var(--space-4, 16px)",
        5: "var(--space-5, 20px)",
        6: "var(--space-6, 24px)",
        8: "var(--space-8, 32px)",
        10: "var(--space-10, 40px)",
        12: "var(--space-12, 48px)",
        16: "var(--space-16, 64px)",
        20: "var(--space-20, 80px)",
      },
      borderRadius: {
        xs: "var(--radius-xs, 4px)",
        sm: "var(--radius-sm, 6px)",
        md: "var(--radius-md, 10px)",
        lg: "var(--radius-lg, 14px)",
        xl: "var(--radius-xl, 20px)",
        pill: "var(--radius-pill, 999px)",
      },
      boxShadow: {
        0: "var(--elev-0, none)",
        1: "var(--elev-1)",
        2: "var(--elev-2)",
        3: "var(--elev-3)",
        4: "var(--elev-4)",
      },
    },
  },
  plugins: [],
} satisfies Config;
```

### 3. Next.js Config (`next.config.js`)

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Strict mode para desarrollo
  reactStrictMode: true,

  // Soporte para imágenes
  images: {
    domains: ["localhost"],
  },

  // Headers de seguridad
  headers: async () => [
    {
      source: "/:path*",
      headers: [
        {
          key: "X-Content-Type-Options",
          value: "nosniff",
        },
        {
          key: "X-Frame-Options",
          value: "DENY",
        },
      ],
    },
  ],

  // Redirects
  redirects: async () => [
    {
      source: "/",
      destination: "/login",
      permanent: false,
    },
  ],
};

module.exports = nextConfig;
```

### 4. PostCSS Config (`postcss.config.js`)

```javascript
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

### 5. ESLint Config (`.eslintrc.json`)

```json
{
  "extends": "next/core-web-vitals",
  "rules": {
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "warn",
    "@next/next/no-html-link-for-pages": "off"
  }
}
```

---

## Variables de Entorno

### Crear `.env.local`

```bash
# Backend API
BACKEND_API_URL=http://localhost:8000

# Supabase (Auth & Database)
NEXT_PUBLIC_SUPABASE_URL=https://[project-id].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...

# Feature Flags
NEXT_PUBLIC_USE_DASHBOARD_HOOK=true
NEXT_PUBLIC_USE_SALES_HOOK=true
NEXT_PUBLIC_USE_TRANSACTIONS_HOOKS=true
NEXT_PUBLIC_USE_CASH_HOOK=true

# API Keys (para terceros)
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=
RESEND_API_KEY=
```

### Crear `.env.example` (para git)

```bash
# Copy .env.local to .env.example, remove sensitive values
BACKEND_API_URL=http://localhost:8000
NEXT_PUBLIC_SUPABASE_URL=https://[your-project].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[your-key-here]
```

### Agregar a `.gitignore`

```
.env.local
.env.*.local
.vercel
```

---

## Scripts en `package.json`

Verifica que el `package.json` tenga estos scripts:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit",
    "format": "prettier --write .",
    "test": "jest",
    "test:watch": "jest --watch"
  }
}
```

---

## Archivos Base Mínimos

### `app/layout.tsx` (versión mínima)

```typescript
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LATAS - Sistema de Ventas",
  description: "El libro de ventas, hecho aplicación",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
```

### `app/page.tsx`

```typescript
import { redirect } from "next/navigation";

export default function Home() {
  redirect("/login");
}
```

### `app/globals.css` (vacío por ahora)

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  /* Axentria variables irán aquí en Phase 2 */
}
```

---

## Verificar Instalación

```bash
# Iniciar dev server
npm run dev

# En otra terminal, verificar que funciona
curl http://localhost:3000

# Debería redirigir a /login
```

---

## Checklist

- [ ] Node.js 18.17+ instalado
- [ ] Proyecto Next.js creado con `create-next-app`
- [ ] TypeScript configurado (`tsconfig.json`)
- [ ] Tailwind CSS instalado y configurado
- [ ] Dependencias principales instaladas (sonner, zod, clsx, etc)
- [ ] Estructura de directorios creada
- [ ] Variables de entorno en `.env.local`
- [ ] `.gitignore` actualizado
- [ ] `npm run dev` funciona sin errores
- [ ] Página home redirige a `/login`

---

## Próximo Paso

→ **PHASE 2: Design System** (CSS variables, fuentes, colores)

En la siguiente fase instalaremos las fuentes del Axentria Design, configuraremos todas las variables CSS, y crearemos el sistema de temas base.

---

## Notas de Troubleshooting

### Error: "Module not found"
```bash
# Limpia node_modules y cache
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### Error: "Cannot find next/image"
```bash
# Next.js no está instalado correctamente
npm install next@latest react@latest react-dom@latest
```

### Error en TypeScript
```bash
# Regenera archivos TypeScript
npm run type-check
```

### Puerto 3000 en uso
```bash
# Usa otro puerto
npm run dev -- -p 3001
```

---

**Estado:** ✅ Phase 1 Complete  
**Duración estimada:** 15-20 minutos  
**Siguiente:** Phase 2 - Design System Setup
