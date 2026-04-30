# LATAS Monorepo

Arquitectura activa:
- `web/`: Next.js (deploy en Vercel)
- `backend/`: FastAPI (deploy en Render)
- `supabase/`: esquema SQL de base de datos

## Estructura

```text
.
├── web/
├── backend/
└── supabase/
```

## Variables de Entorno

### Web (`web/.env.local`)

```env
BACKEND_API_BASE_URL=https://<tu-backend>.onrender.com
APP_ENV=production
```

### Backend (`backend/.env`)

```env
APP_ENV=production
APP_HOST=0.0.0.0
APP_PORT=10000
DATABASE_URL=postgresql+psycopg://postgres:<password>@<host>:5432/postgres?sslmode=require
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin-password
ADMIN_INITIAL_USERNAME=admin
ADMIN_INITIAL_PASSWORD=admin-password
ADMIN_JWT_SECRET=change-me-admin-secret
ADMIN_JWT_ALGORITHM=HS256
ADMIN_JWT_TTL_SECONDS=28800
CORS_ORIGINS=http://localhost:3000,https://<tu-frontend>.vercel.app
```

## Desarrollo Local

### Frontend

```bash
cd web
npm ci
npm run dev
```

### Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn src.api.main:app --host 0.0.0.0 --port 8000 --reload
```

## Deploy

- Vercel: conectar repo `Eternals98/latas` y configurar `Root Directory = web`.
- Render: desplegar `backend` como servicio web Python y definir variables del `.env`.
- Supabase: aplicar `supabase/schema.sql` sobre tu proyecto.
