# Axentria Design → Next.js Web
## PHASE 2: Design System (CSS Variables, Fonts & Colors)

**Versión:** 1.0  
**Fecha:** Mayo 2026  
**Objetivo:** Implementar el sistema de design Axentria con variables CSS, fuentes y colores

---

## 📋 Tabla de Contenidos

1. [Visión del Design System](#visión-del-design-system)
2. [Preparar y copiar fuentes](#preparar-y-copiar-fuentes)
3. [Estructura de colores](#estructura-de-colores)
4. [CSS Variables completas](#css-variables-completas)
5. [Actualizar globals.css](#actualizar-globalscss)
6. [Verificación visual](#verificación-visual)
7. [Checklist de Phase 2](#checklist)

---

## Visión del Design System

### Filosofía Axentria

**"Modern Ledger"** — La herencia del libro de ventas (papel) llevado al web.

**Principios:**
- 🎨 **Calidez y confianza** — Colores inspirados en papel y tinta
- 📚 **Legado** — Honra la tradición del libro de ventas
- 🌿 **Accesible** — Alto contraste, tipografía legible
- ✨ **Refinado** — Elegancia sin artificialidad (no "glassy SaaS")

### Paleta de Colores

| Familia | Propósito | Colores |
|---------|-----------|---------|
| **Ink** | Primary, headings, body text | 950, 900, 800, 700, 600, 500 |
| **Paper** | Backgrounds, surfaces | 50, 100, 200, 300 |
| **Brass** | Accents, highlights, CTAs | 50-700 (amber/gold) |
| **Sage** | Positivo, ingresos, éxito | 50-700 (green) |
| **Coral** | Negativo, outflow, errors | 50-700 (red) |
| **Slate** | Neutrals, UI greys | 50-900 |

---

## Preparar y Copiar Fuentes

### Step 1: Descargar fuentes Axentria

Las fuentes están en `Axentria_Design/fonts/`. Si no las tienes, descarga:

- **Instrument Serif** (Display)
  - `InstrumentSerif-Regular.ttf`
  - `InstrumentSerif-Italic.ttf`

- **Manrope** (Body/Sans)
  - `Manrope-VariableFont_wght.ttf`

- **JetBrains Mono** (Code/Mono)
  - `JetBrainsMono-VariableFont_wght.ttf`
  - `JetBrainsMono-Italic-VariableFont_wght.ttf`

### Step 2: Copiar a `public/fonts/`

```bash
# Crear directorio si no existe
mkdir -p public/fonts

# Copiar fuentes (desde Axentria_Design)
cp Axentria_Design/fonts/*.ttf public/fonts/

# Verificar
ls -la public/fonts/
```

**Resultado esperado:**
```
public/fonts/
├── InstrumentSerif-Italic.ttf
├── InstrumentSerif-Regular.ttf
├── JetBrainsMono-Italic-VariableFont_wght.ttf
├── JetBrainsMono-VariableFont_wght.ttf
└── Manrope-VariableFont_wght.ttf
```

### Step 3: Verificar en `.gitignore`

Las fuentes son assets grandes (2-3 MB). Considera si incluirlas o usar CDN:

```bash
# Opción 1: Incluir en repo (recomendado para control total)
# No añadir a .gitignore

# Opción 2: Usar CDN (Google Fonts, etc)
# Agregar a .gitignore y usar URLs en CSS
```

---

## Estructura de Colores

### Paleta Ink (Primary)

**Uso:** Headings, body text, primary UI elements

```
--ink-950: #07101c   (darkest, borders)
--ink-900: #0f1b2d   (base color - primary brand)
--ink-800: #182640   (hover state)
--ink-700: #233355   (pressed state)
--ink-600: #34466b   (secondary text)
--ink-500: #4a5b7d   (disabled/muted)
```

**Aplicaciones:**
- Headings (h1-h4)
- Body text
- Button backgrounds
- Input borders

### Paleta Paper (Surfaces)

**Uso:** Backgrounds, cards, fondos de aplicación

```
--paper-50:  #fdfbf6  (alternative subtle background)
--paper-100: #faf6ee  (default app background - warm cream)
--paper-200: #f3ecdd  (sunken wells, insets)
--paper-300: #e9deca  (dividers, strong borders)
```

**Aplicaciones:**
- `<body>` background
- Card/panel backgrounds
- Form backgrounds
- Alt panel backgrounds

### Paleta Brass (Accent)

**Uso:** Highlights, accents, primary CTAs. Como "gold leaf on the ledger"

```
--brass-50:  #fdf6e8  (hover state for brass surface)
--brass-100: #faecc8  (light tint)
--brass-200: #f4d896  (lighter tint)
--brass-300: #ecbf5e  (medium)
--brass-400: #e0a24a  (default brass - warm amber)
--brass-500: #c5862e  (hover on buttons)
--brass-600: #9d6820  (pressed state)
--brass-700: #6f4815  (darkest, text on brass)
```

**Aplicaciones:**
- Primary action buttons
- Links hover states
- Active navigation items
- Accent borders
- Focus rings

### Paleta Sage (Positive)

**Uso:** Éxito, ingresos, acciones positivas

```
--sage-50:  #ecf6f0   (light background)
--sage-100: #cfe8d8   (tint)
--sage-300: #7ec3a0   (medium)
--sage-500: #2f9e72   (default sage - vibrant green)
--sage-600: #1f7d59   (hover)
--sage-700: #145a40   (darkest, text on sage)
```

**Aplicaciones:**
- Success messages
- Positive number indicators
- "Income" / "In" cash flows
- Confirmation buttons

### Paleta Coral (Negative/Destructive)

**Uso:** Errores, outflows, acciones destructivas

```
--coral-50:  #fdefe9  (light background)
--coral-100: #f9d4c4  (tint)
--coral-300: #ec9575  (medium)
--coral-500: #d9573d  (default coral - warm red)
--coral-600: #b13e29  (hover)
--coral-700: #82291a  (darkest, text on coral)
```

**Aplicaciones:**
- Error messages
- Warning states
- Negative number indicators
- "Outflow" / "Out" cash
- Delete/destructive actions

### Paleta Slate (Neutral)

**Uso:** UI greys, disabled states, secondary text

```
--slate-50:  #f5f3ee  (light UI background)
--slate-100: #e9e5dc  (input borders, disabled backgrounds)
--slate-200: #d6d1c4  (dividers, borders)
--slate-300: #b8b2a2  (secondary borders)
--slate-400: #918b7c  (placeholder text)
--slate-500: #6c6859  (secondary labels)
--slate-600: #4d4a40  (tertiary text)
--slate-700: #36342d  (strong secondary)
--slate-800: #24231e  (almost black)
--slate-900: #15140f  (darkest)
```

**Aplicaciones:**
- Input/form borders
- Placeholder text
- Disabled states
- Secondary labels
- UI chrome

---

## CSS Variables Completas

### Template de variables CSS

Todas las variables que necesita Axentria:

```css
:root {
  /* ================================================================
     CORE PALETTE (colores fundamentales)
     ================================================================ */

  /* Ink — primary brand color */
  --ink-950: #07101c;
  --ink-900: #0f1b2d;
  --ink-800: #182640;
  --ink-700: #233355;
  --ink-600: #34466b;
  --ink-500: #4a5b7d;

  /* Paper — warm cream surfaces */
  --paper-50:  #fdfbf6;
  --paper-100: #faf6ee;
  --paper-200: #f3ecdd;
  --paper-300: #e9deca;

  /* Brass — amber accent, gold leaf */
  --brass-50:  #fdf6e8;
  --brass-100: #faecc8;
  --brass-200: #f4d896;
  --brass-300: #ecbf5e;
  --brass-400: #e0a24a;
  --brass-500: #c5862e;
  --brass-600: #9d6820;
  --brass-700: #6f4815;

  /* Sage — positive, income, success */
  --sage-50:  #ecf6f0;
  --sage-100: #cfe8d8;
  --sage-300: #7ec3a0;
  --sage-500: #2f9e72;
  --sage-600: #1f7d59;
  --sage-700: #145a40;

  /* Coral — negative, outflow, destructive */
  --coral-50:  #fdefe9;
  --coral-100: #f9d4c4;
  --coral-300: #ec9575;
  --coral-500: #d9573d;
  --coral-600: #b13e29;
  --coral-700: #82291a;

  /* Slate — neutral UI greys */
  --slate-50:  #f5f3ee;
  --slate-100: #e9e5dc;
  --slate-200: #d6d1c4;
  --slate-300: #b8b2a2;
  --slate-400: #918b7c;
  --slate-500: #6c6859;
  --slate-600: #4d4a40;
  --slate-700: #36342d;
  --slate-800: #24231e;
  --slate-900: #15140f;

  /* ================================================================
     SEMANTIC COLORS (colores de propósito)
     ================================================================ */

  /* Surfaces */
  --surface-app:        var(--paper-100);     /* app background */
  --surface-panel:      #ffffff;              /* cards, modals */
  --surface-panel-alt:  var(--paper-50);     /* subtle alt panels */
  --surface-sunken:     var(--paper-200);    /* inset wells */
  --surface-inverse:    var(--ink-900);      /* dark blocks */

  /* Foreground (text) */
  --fg-1: var(--ink-900);      /* primary text */
  --fg-2: var(--slate-600);    /* secondary text */
  --fg-3: var(--slate-500);    /* tertiary, captions */
  --fg-muted: var(--slate-400); /* muted/disabled */
  --fg-on-inverse: var(--paper-50);  /* text on dark bg */
  --fg-on-brass:   var(--ink-900);   /* text on brass */

  /* Actions */
  --action-primary-bg:       var(--ink-900);
  --action-primary-bg-hover: var(--ink-800);
  --action-primary-fg:       var(--paper-50);

  --action-accent-bg:        var(--brass-400);
  --action-accent-bg-hover:  var(--brass-500);
  --action-accent-fg:        var(--ink-900);

  --action-positive-bg:      var(--sage-500);
  --action-positive-fg:      #ffffff;

  --action-danger-bg:        var(--coral-500);
  --action-danger-fg:        #ffffff;

  /* Borders */
  --border-subtle: color-mix(in oklab, var(--slate-200) 70%, transparent);
  --border-default: var(--slate-200);
  --border-strong:  var(--slate-300);
  --border-inverse: var(--ink-700);

  /* Status (semantic feedback) */
  --status-success-fg: var(--sage-700);
  --status-success-bg: var(--sage-50);

  --status-danger-fg:  var(--coral-700);
  --status-danger-bg:  var(--coral-50);

  --status-warn-fg:    var(--brass-700);
  --status-warn-bg:    var(--brass-50);

  --status-info-fg:    var(--ink-800);
  --status-info-bg:    color-mix(in oklab, var(--ink-900) 8%, white);

  /* ================================================================
     SPACING SCALE (4px base)
     ================================================================ */
  --space-0:  0;
  --space-1:  4px;
  --space-2:  8px;
  --space-3:  12px;
  --space-4:  16px;
  --space-5:  20px;
  --space-6:  24px;
  --space-8:  32px;
  --space-10: 40px;
  --space-12: 48px;
  --space-16: 64px;
  --space-20: 80px;

  /* ================================================================
     BORDER RADIUS
     ================================================================ */
  --radius-xs:   4px;
  --radius-sm:   6px;
  --radius-md:   10px;
  --radius-lg:   14px;
  --radius-xl:   20px;
  --radius-pill: 999px;

  /* ================================================================
     SHADOWS / ELEVATION (soft, ink-on-paper feel)
     ================================================================ */
  --elev-0: none;
  --elev-1: 0 1px 0 rgba(15,27,45,0.04), 0 1px 2px rgba(15,27,45,0.06);
  --elev-2: 0 1px 0 rgba(15,27,45,0.04), 0 4px 12px -2px rgba(15,27,45,0.08);
  --elev-3: 0 2px 0 rgba(15,27,45,0.04), 0 12px 28px -8px rgba(15,27,45,0.14);
  --elev-4: 0 24px 60px -20px rgba(15,27,45,0.28);

  /* Inset border for focus ring */
  --inset-1: inset 0 0 0 1px var(--border-default);
  --inset-focus: 0 0 0 3px color-mix(in oklab, var(--brass-400) 50%, transparent);

  /* ================================================================
     TYPOGRAPHY
     ================================================================ */
  --font-display: "Instrument Serif", "Iowan Old Style", Georgia, serif;
  --font-sans:    "Manrope", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
  --font-mono:    "JetBrains Mono", ui-monospace, "SF Mono", Menlo, monospace;

  /* Type scale */
  --fs-display-xl: 72px;
  --fs-display-lg: 56px;
  --fs-display-md: 40px;
  --fs-h1:  32px;
  --fs-h2:  24px;
  --fs-h3:  20px;
  --fs-h4:  17px;
  --fs-body:    15px;
  --fs-body-sm: 13px;
  --fs-caption: 12px;
  --fs-overline: 11px;

  /* Line heights */
  --lh-tight:  1.1;
  --lh-snug:   1.25;
  --lh-normal: 1.45;
  --lh-loose:  1.6;

  /* Letter spacing */
  --tracking-tight: -0.02em;
  --tracking-normal: 0;
  --tracking-wide:  0.04em;
  --tracking-overline: 0.12em;

  /* ================================================================
     MOTION
     ================================================================ */
  --ease-standard: cubic-bezier(.2,.7,.2,1);
  --ease-out-soft: cubic-bezier(0,0,.2,1);
  --dur-1: 120ms;
  --dur-2: 200ms;
  --dur-3: 320ms;
}
```

---

## Actualizar `globals.css`

### Reemplazar contenido completo

```bash
# Backup del archivo actual
cp app/globals.css app/globals.css.bak

# Editar archivo
```

**`app/globals.css`** (contenido completo):

```css
/* ================================================================
   Axentria Design System — Colors & Type
   ================================================================
   Brand DNA: "Modern ledger" — heritage of the paper sales book
   made for the web. Warm, confident, trustworthy.
   ================================================================ */

@tailwind base;
@tailwind components;
@tailwind utilities;

/* ================================================================
   FONT FACES — Self-hosted Axentria fonts
   ================================================================ */

@font-face {
  font-family: "Instrument Serif";
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url("/fonts/InstrumentSerif-Regular.ttf") format("truetype");
}

@font-face {
  font-family: "Instrument Serif";
  font-style: italic;
  font-weight: 400;
  font-display: swap;
  src: url("/fonts/InstrumentSerif-Italic.ttf") format("truetype");
}

@font-face {
  font-family: "Manrope";
  font-style: normal;
  font-weight: 200 800;
  font-display: swap;
  src: url("/fonts/Manrope-VariableFont_wght.ttf") format("truetype-variations");
}

@font-face {
  font-family: "JetBrains Mono";
  font-style: normal;
  font-weight: 100 800;
  font-display: swap;
  src: url("/fonts/JetBrainsMono-VariableFont_wght.ttf") format("truetype-variations");
}

@font-face {
  font-family: "JetBrains Mono";
  font-style: italic;
  font-weight: 100 800;
  font-display: swap;
  src: url("/fonts/JetBrainsMono-Italic-VariableFont_wght.ttf") format("truetype-variations");
}

/* ================================================================
   CSS VARIABLES — Complete Axentria design tokens
   ================================================================ */

:root {
  /* Core palette */
  --ink-950: #07101c;
  --ink-900: #0f1b2d;
  --ink-800: #182640;
  --ink-700: #233355;
  --ink-600: #34466b;
  --ink-500: #4a5b7d;

  --paper-50:  #fdfbf6;
  --paper-100: #faf6ee;
  --paper-200: #f3ecdd;
  --paper-300: #e9deca;

  --brass-50:  #fdf6e8;
  --brass-100: #faecc8;
  --brass-200: #f4d896;
  --brass-300: #ecbf5e;
  --brass-400: #e0a24a;
  --brass-500: #c5862e;
  --brass-600: #9d6820;
  --brass-700: #6f4815;

  --sage-50:  #ecf6f0;
  --sage-100: #cfe8d8;
  --sage-300: #7ec3a0;
  --sage-500: #2f9e72;
  --sage-600: #1f7d59;
  --sage-700: #145a40;

  --coral-50:  #fdefe9;
  --coral-100: #f9d4c4;
  --coral-300: #ec9575;
  --coral-500: #d9573d;
  --coral-600: #b13e29;
  --coral-700: #82291a;

  --slate-50:  #f5f3ee;
  --slate-100: #e9e5dc;
  --slate-200: #d6d1c4;
  --slate-300: #b8b2a2;
  --slate-400: #918b7c;
  --slate-500: #6c6859;
  --slate-600: #4d4a40;
  --slate-700: #36342d;
  --slate-800: #24231e;
  --slate-900: #15140f;

  /* Semantic surfaces */
  --surface-app:        var(--paper-100);
  --surface-panel:      #ffffff;
  --surface-panel-alt:  var(--paper-50);
  --surface-sunken:     var(--paper-200);
  --surface-inverse:    var(--ink-900);

  /* Semantic foreground */
  --fg-1: var(--ink-900);
  --fg-2: var(--slate-600);
  --fg-3: var(--slate-500);
  --fg-muted: var(--slate-400);
  --fg-on-inverse: var(--paper-50);
  --fg-on-brass:   var(--ink-900);

  /* Semantic actions */
  --action-primary-bg:        var(--ink-900);
  --action-primary-bg-hover:  var(--ink-800);
  --action-primary-fg:        var(--paper-50);

  --action-accent-bg:         var(--brass-400);
  --action-accent-bg-hover:   var(--brass-500);
  --action-accent-fg:         var(--ink-900);

  --action-positive-bg:       var(--sage-500);
  --action-positive-fg:       #ffffff;

  --action-danger-bg:         var(--coral-500);
  --action-danger-fg:         #ffffff;

  /* Borders */
  --border-subtle: color-mix(in oklab, var(--slate-200) 70%, transparent);
  --border-default: var(--slate-200);
  --border-strong:  var(--slate-300);
  --border-inverse: var(--ink-700);

  /* Status */
  --status-success-fg: var(--sage-700);
  --status-success-bg: var(--sage-50);
  --status-danger-fg:  var(--coral-700);
  --status-danger-bg:  var(--coral-50);
  --status-warn-fg:    var(--brass-700);
  --status-warn-bg:    var(--brass-50);
  --status-info-fg:    var(--ink-800);
  --status-info-bg:    color-mix(in oklab, var(--ink-900) 8%, white);

  /* Spacing */
  --space-0:  0;
  --space-1:  4px;
  --space-2:  8px;
  --space-3:  12px;
  --space-4:  16px;
  --space-5:  20px;
  --space-6:  24px;
  --space-8:  32px;
  --space-10: 40px;
  --space-12: 48px;
  --space-16: 64px;
  --space-20: 80px;

  /* Radii */
  --radius-xs:   4px;
  --radius-sm:   6px;
  --radius-md:   10px;
  --radius-lg:   14px;
  --radius-xl:   20px;
  --radius-pill: 999px;

  /* Shadows */
  --elev-0: none;
  --elev-1: 0 1px 0 rgba(15,27,45,0.04), 0 1px 2px rgba(15,27,45,0.06);
  --elev-2: 0 1px 0 rgba(15,27,45,0.04), 0 4px 12px -2px rgba(15,27,45,0.08);
  --elev-3: 0 2px 0 rgba(15,27,45,0.04), 0 12px 28px -8px rgba(15,27,45,0.14);
  --elev-4: 0 24px 60px -20px rgba(15,27,45,0.28);
  --inset-1: inset 0 0 0 1px var(--border-default);
  --inset-focus: 0 0 0 3px color-mix(in oklab, var(--brass-400) 50%, transparent);

  /* Typography */
  --font-display: "Instrument Serif", "Iowan Old Style", Georgia, serif;
  --font-sans:    "Manrope", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
  --font-mono:    "JetBrains Mono", ui-monospace, "SF Mono", Menlo, monospace;

  --fs-display-xl: 72px;
  --fs-display-lg: 56px;
  --fs-display-md: 40px;
  --fs-h1:  32px;
  --fs-h2:  24px;
  --fs-h3:  20px;
  --fs-h4:  17px;
  --fs-body:    15px;
  --fs-body-sm: 13px;
  --fs-caption: 12px;
  --fs-overline: 11px;

  --lh-tight:  1.1;
  --lh-snug:   1.25;
  --lh-normal: 1.45;
  --lh-loose:  1.6;

  --tracking-tight: -0.02em;
  --tracking-normal: 0;
  --tracking-wide:  0.04em;
  --tracking-overline: 0.12em;

  /* Motion */
  --ease-standard: cubic-bezier(.2,.7,.2,1);
  --ease-out-soft: cubic-bezier(0,0,.2,1);
  --dur-1: 120ms;
  --dur-2: 200ms;
  --dur-3: 320ms;
}

/* ================================================================
   BASE STYLES — HTML semantic defaults
   ================================================================ */

html, body {
  background: var(--surface-app);
  color: var(--fg-1);
  font-family: var(--font-sans);
  font-size: var(--fs-body);
  line-height: var(--lh-normal);
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}

h1, .h1, h2, .h2, h3, .h3, h4, .h4 {
  font-family: var(--font-sans);
  color: var(--fg-1);
  letter-spacing: var(--tracking-tight);
  margin: 0;
}

h1, .h1 { font-size: var(--fs-h1); font-weight: 700; line-height: var(--lh-snug); }
h2, .h2 { font-size: var(--fs-h2); font-weight: 700; line-height: var(--lh-snug); }
h3, .h3 { font-size: var(--fs-h3); font-weight: 600; line-height: var(--lh-snug); }
h4, .h4 { font-size: var(--fs-h4); font-weight: 600; line-height: var(--lh-snug); }

.display, .display-lg, .display-md {
  font-family: var(--font-display);
  font-weight: 400;
  letter-spacing: -0.01em;
  line-height: var(--lh-tight);
  color: var(--fg-1);
}

.display     { font-size: var(--fs-display-xl); }
.display-lg  { font-size: var(--fs-display-lg); }
.display-md  { font-size: var(--fs-display-md); }

p, .body { font-size: var(--fs-body); line-height: var(--lh-normal); color: var(--fg-1); margin: 0; }
.body-sm  { font-size: var(--fs-body-sm); line-height: var(--lh-normal); color: var(--fg-2); }
.caption  { font-size: var(--fs-caption); color: var(--fg-3); }
.overline {
  font-size: var(--fs-overline);
  letter-spacing: var(--tracking-overline);
  text-transform: uppercase;
  font-weight: 600;
  color: var(--fg-2);
}

.figure, .num, code, kbd {
  font-family: var(--font-mono);
  font-variant-numeric: tabular-nums;
}

code, kbd {
  font-size: 0.92em;
  background: var(--surface-sunken);
  padding: 2px 6px;
  border-radius: var(--radius-xs);
  color: var(--ink-800);
}

a {
  color: var(--ink-900);
  text-underline-offset: 3px;
  text-decoration-thickness: 1px;
}

a:hover {
  color: var(--brass-600);
}

::selection {
  background: var(--brass-200);
  color: var(--ink-900);
}

/* ================================================================
   UTILITY CLASSES
   ================================================================ */

/* Paper grain texture (optional) */
.paper-grain {
  background-image:
    repeating-linear-gradient(
      45deg,
      transparent,
      transparent 2px,
      rgba(15, 27, 45, 0.02) 2px,
      rgba(15, 27, 45, 0.02) 4px
    );
}

/* Focus visible ring (accessibility) */
*:focus-visible {
  outline: 2px solid var(--brass-400);
  outline-offset: 2px;
}

/* Smooth transitions */
button, a, input, textarea, select {
  transition: background-color var(--dur-2) var(--ease-standard),
              color var(--dur-2) var(--ease-standard),
              border-color var(--dur-2) var(--ease-standard);
}
```

---

## Verificación Visual

### Comprobar que los colores se cargan

```bash
# 1. Iniciar dev server
npm run dev

# 2. Abrir navegador
# http://localhost:3000

# 3. Abrir DevTools (F12)
# 4. Inspector → click en <body>
# 5. Verificar en Styles que las variables CSS se muestren
```

**Esperado:** El fondo debe ser `#faf6ee` (paper-100, crema cálida)

### Probar variables CSS en consola

```javascript
// Abrir consola (F12 → Console)

// Obtener todas las variables
const styles = getComputedStyle(document.documentElement);

// Ver un color específico
styles.getPropertyValue('--brass-400').trim();   // → "#e0a24a"
styles.getPropertyValue('--ink-900').trim();     // → "#0f1b2d"

// Ver una fuente
styles.getPropertyValue('--font-sans').trim();   // → "Manrope", ...
```

### Crear test page (opcional)

**`app/design-system/page.tsx`** (para verificación visual):

```typescript
export default function DesignSystemPage() {
  return (
    <div className="p-8 bg-paper-100 min-h-screen">
      <h1 className="text-ink-900 mb-8">Axentria Design System Test</h1>

      {/* Colors */}
      <section className="mb-12">
        <h2 className="text-2xl mb-4">Colors</h2>
        <div className="grid grid-cols-5 gap-4">
          <div className="bg-ink-900 h-20 rounded" />
          <div className="bg-brass-400 h-20 rounded" />
          <div className="bg-sage-500 h-20 rounded" />
          <div className="bg-coral-500 h-20 rounded" />
          <div className="bg-paper-100 h-20 border border-slate-200 rounded" />
        </div>
      </section>

      {/* Typography */}
      <section className="mb-12">
        <h2 className="text-2xl mb-4">Typography</h2>
        <p className="font-display text-4xl mb-2">Display — Instrument Serif</p>
        <p className="font-sans text-lg mb-2">Body — Manrope</p>
        <p className="font-mono text-sm mb-2">Code — JetBrains Mono</p>
      </section>
    </div>
  );
}
```

---

## Troubleshooting

### Las fuentes no cargan

```
Error: 404 - /fonts/InstrumentSerif-Regular.ttf not found
```

**Soluciones:**
1. Verifica que las fuentes estén en `public/fonts/`
2. Limpia el cache: `rm -rf .next` y `npm run dev`
3. Verifica el nombre exacto del archivo (case-sensitive en Linux/Mac)

### Los colores no se ven

```css
/* Si ves gris en lugar de colores */
background: var(--brass-400);  /* No funciona si las variables no se cargan */
```

**Soluciones:**
1. Verifica que `app/globals.css` se importe en `app/layout.tsx`
2. Abre DevTools y verifica que el CSS esté en `<head>`
3. Reconstruye: `rm -rf .next && npm run dev`

### CSS variables en Tailwind no funcionan

```bash
# Si las clases Tailwind no leen las variables
# Verifica tailwind.config.ts:

# ✅ Correcto:
colors: {
  brass: { 400: "var(--brass-400)" }
}

# ❌ Incorrecto:
colors: {
  brass: { 400: "#e0a24a" }  // Hardcoded, no usa variable
}
```

---

## Checklist

- [ ] Fuentes copiadas a `public/fonts/`
- [ ] `app/globals.css` actualizado con variables CSS completas
- [ ] `@font-face` declarados para todas las fuentes
- [ ] `:root` contiene todas las variables de color, spacing, typography
- [ ] `tailwind.config.ts` referencia las variables CSS
- [ ] `npm run dev` funciona sin errores
- [ ] Fondo de la página es `#faf6ee` (paper-100)
- [ ] DevTools muestra las variables CSS correctamente
- [ ] Las fuentes se cargan en `<head>`
- [ ] Tipografía se ve bien (Manrope para body, Instrument Serif para headings)

---

## Próximo Paso

→ **PHASE 3: Primitive Components** (Button, Input, Card, Icon, etc)

En la siguiente fase crearemos los componentes base reutilizables que forman la base de todos los UI's.

---

**Estado:** ✅ Phase 2 Complete  
**Duración estimada:** 30-45 minutos  
**Siguiente:** Phase 3 - Primitive Components
