# 📊 Sistema de Gestión de Ventas (App Local)

# 📌 Levantamiento inicial de requerimientos

Actualmente se manejan dos archivos de Excel de ventas:

- Uno para **ventas facturadas**
- Otro para **ventas informales**

La idea es migrar esta información a una **base de datos**, eliminando la dependencia de Excel como fuente principal.

Se requiere una **aplicación web interna**, sin exposición a internet, accesible desde dos equipos en red local.

## 🎯 Objetivo general

Construir una aplicación web para:

- Registro de ventas
- Consulta y reportes
- Edición controlada
- Exportación
- Análisis de datos

---

# 🧩 Alcance funcional

## 1. Registro de ventas

### Campos base

- Empresa:
  - LATAS SAS
  - TOMAS GOMEZ

- Tipo:
  - Formal
  - Informal

- Número:
  - Factura (formal)
  - Nota (informal)

- Descripción (multilínea)
- Valor total

---

## 2. Clientes

- Nombre
- Teléfono

### Comportamiento

- Autocompletado
- Detección de coincidencias
- Creación opcional

---

## 3. Formas de pago

### Medios actuales

- Efectivo
- Tarjetas
- Bancos
- Nequi
- Otros

### Requerimiento

- Múltiples pagos por venta
- Estructura:
  - Medio
  - Monto

---

## 4. Reportes

- Ventas por mes
- Preparado para consolidación futura

---

## 5. Edición

- Solo administrador
- Control de permisos
- Auditoría futura

---

## 6. Dashboard

KPIs:

- Ventas por mes
- Ventas por empresa
- Ticket promedio
- Métodos de pago
- Clientes frecuentes

---

## 7. Exportación

- Excel facturadas
- Excel informales

---

## 8. IA local (opcional)

- Análisis automático
- Tendencias
- Consultas en lenguaje natural

---

# ⚙️ Requerimientos técnicos

- Red local (sin internet)
- Acceso desde 2 PCs
- Base de datos (SQLite inicialmente)
- Docker opcional
- Dominio local (ventas.local)

---

# 🧱 Arquitectura

## 🧩 Arquitectura General

```
┌─────────────────────────────────────────────────────────┐
│                     RED LOCAL (LAN)                      │
│                                                         │
│  ┌──────────────┐              ┌──────────────────────┐ │
│  │  PC Servidor │◄────────────►│   PC Cliente         │ │
│  │  (Host App)  │   carpeta    │   (Navegador Web)    │ │
│  │              │   compartida │                      │ │
│  └──────┬───────┘              └──────────────────────┘ │
│         │                                               │
│  ┌──────▼───────────────────────────────────────────┐  │
│  │            STACK LOCAL                           │  │
│  │  FastAPI (Backend) + SQLite (DB) + React (Front) │  │
│  │  + Ollama (LLM local, opcional)                  │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

## ⚙️ Stack Tecnológico

### Backend

| Componente   | Tecnología           | Por qué                                |
|--------------|---------------------|----------------------------------------|
| API REST     | FastAPI (Python)    | Ligero, rápido, fácil de mantener      |
| Base de datos| SQLite              | Sin servidor, un solo archivo portable |
| ORM          | SQLAlchemy          | Manejo simple de modelos               |
| Auth admin   | JWT / bcrypt        | Seguridad básica sin login complejo    |

### Frontend

| Componente   | Tecnología      | Por qué                           |
|--------------|----------------|-----------------------------------|
| UI           | React + Vite   | Rápido, moderno, extensible       |
| Estilos      | Tailwind CSS   | Liviano, consistente              |
| Gráficas     | Recharts       | Ideal para dashboards             |
| HTTP client  | Axios          | Simple para llamadas a la API     |

## 🧠 LLM Local (Opcional)

| Componente     | Tecnología                | Por qué                                |
|----------------|--------------------------|----------------------------------------|
| Motor LLM      | Ollama                   | Ejecuta modelos locales                |
| Modelo sugerido| Phi-3 Mini / Mistral 7B  | Livianos, funcionan en CPU             |
| Integración    | /api/analisis            | Permite análisis interno de datos      |

---

# 🐳 Docker

- nginx
- frontend
- backend
- ollama (opcional)

