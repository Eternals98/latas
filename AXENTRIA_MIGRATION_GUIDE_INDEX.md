# Axentria Design → Next.js Web
## Complete Migration Guide — Index

**Guía exhaustiva para migrar Axentria Design System a una aplicación Next.js moderna desde cero.**

**Última actualización:** Mayo 2026  
**Público:** Desarrolladores Frontend/Full-Stack  
**Duración total:** 20-30 horas (distribuidas en 8 phases)  
**Nivel:** Intermedio-Avanzado

---

## 🎯 Objetivo

Construir una aplicación web moderna (Next.js 14+) que implemente completamente el **Axentria Design System**, un sistema de diseño profesional inspirado en la estética de un libro de ventas moderno.

### Resultado Final

Una aplicación funcional con:
- ✅ Sistema de colores Axentria completo (Ink, Paper, Brass, Sage, Coral, Slate)
- ✅ Tipografía profesional (Instrument Serif, Manrope, JetBrains Mono)
- ✅ Componentes primitivos reutilizables
- ✅ Screens complejas (Login, Sales, Dashboard, Cash Management)
- ✅ Autenticación y autorización
- ✅ Integración con API backend
- ✅ Responsive design completo
- ✅ Accesibilidad (a11y)

---

## 📚 Phases

### [PHASE 1: Project Setup & Architecture](./AXENTRIA_MIGRATION_GUIDE_PHASE_1_SETUP.md)

**Duración:** 15-20 minutos

Configurar la estructura base del proyecto Next.js con todas las herramientas necesarias.

**Temas:**
- Crear proyecto Next.js desde cero
- Estructura de directorios
- Configuración TypeScript, Tailwind, ESLint
- Variables de entorno
- Scripts y dependencias

**Resultado:** Proyecto funcional en `localhost:3000/login`

---

### [PHASE 2: Design System](./AXENTRIA_MIGRATION_GUIDE_PHASE_2_DESIGN_SYSTEM.md)

**Duración:** 30-45 minutos

Implementar el sistema de diseño Axentria con CSS variables, fuentes y colores.

**Temas:**
- Copiar fuentes self-hosted
- Definir paleta de colores completa
- CSS variables para todos los tokens
- Actualizar `globals.css`
- Verificación visual

**Resultado:** Aplicación con colores y tipografía Axentria

---

### PHASE 3: Primitive Components

**Duración:** 1.5-2 horas

Crear componentes base reutilizables (Button, Input, Card, Icon, Avatar, etc).

**Temas:**
- Componente Button (variantes, sizes, states)
- Componente Input (text, email, password, number)
- Componente Card (elevations, padding)
- Icon wrapper (Lucide React)
- Select/Dropdown
- Badge, Avatar, Divider
- Utilities (cn, cn function)

**Resultado:** Biblioteca de componentes primitivos en `Primitives.tsx`

---

### PHASE 4: Complex Components & Screens

**Duración:** 2-2.5 horas

Construir screens completos (LoginScreen, SaleScreen, DashboardScreen, etc).

**Temas:**
- LoginScreen (login y register)
- SaleScreen (formulario de ventas)
- DashboardScreen (métricas)
- CashScreen (gestión de caja)
- TransactionsScreen (historial)
- ReportsScreen (reportes/export)
- Shell/AppShell (sidebar + topbar)

**Resultado:** Todos los screens del sistema funcionales

---

### PHASE 5: Data Hooks & State Management

**Duración:** 2-2.5 horas

Crear hooks para gestionar datos, estado global e integración con API.

**Temas:**
- Hook `useSales` (crear, editar, cancelar ventas)
- Hook `useCash` (abrir, cerrar caja, retiros)
- Hook `useDashboard` (métricas agregadas)
- Hook `useTransactions` (historial)
- Hook `useLookupData` (catálogos)
- Hook `useSessionInfo` (perfil usuario)
- Estados de carga, error, success

**Resultado:** Lógica de datos completamente funcional

---

### PHASE 6: Authentication & Authorization

**Duración:** 1.5-2 horas

Implementar login, registro, sesiones y control de acceso.

**Temas:**
- Login con Supabase Auth
- Registro de usuarios
- JWT handling
- Session management (cookies HTTP-only)
- Rutas protegidas
- Control de roles (admin, cashier)
- CSRF protection

**Resultado:** Sistema de autenticación seguro

---

### PHASE 7: Routing, Navigation & Responsive Design

**Duración:** 1.5-2 horas

Configurar navegación, rutas y responsiveness.

**Temas:**
- Next.js App Router
- Navegación principal (sidebar + breadcrumbs)
- Mobile navigation (drawer)
- Responsive design (mobile, tablet, desktop)
- Meta tags y SEO
- Error handling y 404 pages

**Resultado:** Navegación completa y responsive

---

### PHASE 8: Deployment & Production

**Duración:** 1-1.5 horas

Preparar para producción y deploy.

**Temas:**
- Build optimization
- Environment variables para prod
- Vercel deployment
- CI/CD pipeline
- Monitoring y logging
- Performance tuning
- Security checklist

**Resultado:** Aplicación lista para producción

---

## 🚀 Quick Start

Si ya tienes experiencia con Next.js, puedes acelerar:

```bash
# OPTION 1: Start from PHASE 1 (recomendado)
# Sigue cada phase en orden

# OPTION 2: Use template (si es recomendable)
# (Será disponible después de completar todas las phases)
```

---

## 📋 Requisitos Previos

### Conocimientos técnicos
- React 18+ (hooks, context)
- Next.js 14+ (App Router)
- TypeScript
- Tailwind CSS
- CSS variables
- REST APIs / Fetch

### Herramientas
- Node.js 18.17+ (preferently 20.x)
- npm 9.0+
- Git
- Code editor (VS Code recomendado)
- Git Bash / Terminal

### Arquitectura entendida
- Frontend (Next.js) ↔ Backend (FastAPI/similar)
- Autenticación (JWT en cookies)
- Estado global vs local
- Validación frontend y backend

---

## 📊 Project Structure Overview

```
latas-web/
├── app/                          # Next.js App Router pages
│   ├── (auth)/                  # Auth pages group
│   ├── (dashboard)/             # Dashboard pages
│   ├── api/                     # API routes (BFF proxy)
│   ├── layout.tsx               # Root layout
│   └── globals.css              # CSS variables
│
├── components/                  # React components
│   ├── Primitives.tsx           # Base UI components
│   ├── Shell.tsx                # Sidebar + Topbar
│   ├── LoginScreen.tsx          # Full screens
│   ├── SaleScreen.tsx
│   ├── DashboardScreen.tsx
│   └── ...
│
├── lib/                         # Utilities & logic
│   ├── hooks/                   # Data hooks
│   ├── auth.ts                  # Auth utilities
│   ├── backend.ts               # API client
│   ├── validation.ts            # Zod schemas
│   └── types/                   # TypeScript types
│
├── public/                      # Static assets
│   ├── fonts/                   # Axentria fonts
│   └── assets/                  # Images/SVG
│
├── .env.local                   # Environment variables
├── tailwind.config.ts           # Tailwind config
├── tsconfig.json                # TypeScript config
└── next.config.js               # Next.js config
```

---

## 🎓 Learning Path

**Si eres nuevo en Next.js:**
1. Lee documentación Next.js (App Router)
2. Completa PHASE 1-2 lentamente
3. Aprende Tailwind basics
4. Continúa con PHASE 3-4

**Si ya conoces React/Next.js:**
1. Escanea PHASE 1-2 rápidamente
2. Enfocate en PHASE 3 (componentes)
3. PHASE 4-6 en paralelo
4. PHASE 7-8 para production

**Si eres Full-Stack:**
1. Comienza directo en PHASE 3
2. PHASE 5 (data hooks) es crítica
3. Coordina con backend en PHASE 5-6

---

## ⏱️ Time Estimates

| Phase | Tópico | Duración |
|-------|--------|----------|
| 1 | Setup | 15-20 min |
| 2 | Design System | 30-45 min |
| 3 | Primitives | 1.5-2 h |
| 4 | Screens | 2-2.5 h |
| 5 | Data Hooks | 2-2.5 h |
| 6 | Auth | 1.5-2 h |
| 7 | Routing | 1.5-2 h |
| 8 | Deployment | 1-1.5 h |
| **Total** | **Toda la guía** | **13-16 h** |

**Nota:** Tiempos varían según experiencia. Developers experimentados pueden completar en 8-10h.

---

## 🔗 Dependencias Principales

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "next": "^14.0.0",
    "sonner": "^1.2.0",
    "zod": "^3.22.0",
    "lucide-react": "^0.292.0",
    "recharts": "^2.10.0",
    "clsx": "^2.0.0",
    "tailwind-merge": "^2.2.0",
    "jose": "^5.0.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "tailwindcss": "^3.3.0",
    "postcss": "^8.4.0",
    "autoprefixer": "^10.4.0",
    "eslint": "^8.0.0"
  }
}
```

---

## 🎨 Design System at a Glance

### Colores

| Token | Propósito | Paleta |
|-------|-----------|--------|
| **Ink** | Primary, text, headings | --ink-950 a --ink-500 |
| **Paper** | Backgrounds, surfaces | --paper-50 a --paper-300 |
| **Brass** | Accent, highlights, CTA | --brass-50 a --brass-700 |
| **Sage** | Positive, success, income | --sage-50 a --sage-700 |
| **Coral** | Negative, error, outflow | --coral-50 a --coral-700 |
| **Slate** | Neutral, UI, disabled | --slate-50 a --slate-900 |

### Tipografía

| Font | Uso | Familia |
|------|-----|---------|
| **Display** | Headings grandes | Instrument Serif |
| **Body** | Texto, UI | Manrope |
| **Mono** | Código, números | JetBrains Mono |

### Spacing

Base 4px: `0, 4px, 8px, 12px, 16px, 20px, 24px, 32px, 40px, ...`

### Shadows (Elevation)

Soft, ink-on-paper feel (no glassy):
- `--elev-0`: none
- `--elev-1`: subtle
- `--elev-2`: medium
- `--elev-3`: elevated
- `--elev-4`: highest

---

## 📖 Reading Order

**Recomendado (en orden):**
1. 📘 Este índice (overview)
2. 📗 PHASE 1 (setup)
3. 📙 PHASE 2 (design system)
4. 📕 PHASE 3 (primitives) — **CRÍTICA**
5. 📓 PHASE 4 (screens)
6. 📔 PHASE 5 (data) — **CRÍTICA**
7. 📒 PHASE 6 (auth)
8. 📑 PHASE 7 (routing)
9. 📰 PHASE 8 (deployment)

---

## ✅ Progress Tracker

Marca cada phase al completarla:

- [ ] PHASE 1: Setup
- [ ] PHASE 2: Design System
- [ ] PHASE 3: Primitives
- [ ] PHASE 4: Screens
- [ ] PHASE 5: Data Hooks
- [ ] PHASE 6: Auth
- [ ] PHASE 7: Routing
- [ ] PHASE 8: Deployment

**Milestone 1:** ✅ PHASE 1-2 = Proyecto base  
**Milestone 2:** ✅ PHASE 3-4 = Componentes visuales  
**Milestone 3:** ✅ PHASE 5-6 = Lógica funcional  
**Milestone 4:** ✅ PHASE 7-8 = Production-ready  

---

## 🤝 Contributing & Feedback

Si encuentras errores o tienes mejoras:

1. Documenta el problema
2. Sugiere la solución
3. Incluye ejemplos de código
4. Proporciona contexto de versión (Node.js, Next.js, etc)

---

## 📞 Support & Troubleshooting

Cada phase incluye una sección "Troubleshooting" con:
- Errores comunes
- Soluciones
- Verificación de estado

Para problemas generales:
- Verifica `npm --version` y `node --version`
- Limpia cache: `rm -rf .next node_modules && npm install`
- Consulta los logs en `npm run dev`

---

## 🎬 Getting Started Now

```bash
# 1. Abre PHASE 1
# 2. Sigue cada step
# 3. Verifica checklist al final
# 4. Procede a PHASE 2

# ¡Buena suerte! 🚀
```

---

**Creada por:** Axentria Design System Migration Guide  
**Licencia:** MIT (uso libre para educación y proyectos comerciales)  
**Actualizada:** Mayo 2026

---

## Quick Links

- 📘 [PHASE 1: Setup](./AXENTRIA_MIGRATION_GUIDE_PHASE_1_SETUP.md)
- 📙 [PHASE 2: Design System](./AXENTRIA_MIGRATION_GUIDE_PHASE_2_DESIGN_SYSTEM.md)
- 🔗 [PHASE 3-8] Coming soon...
