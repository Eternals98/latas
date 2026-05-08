# Axentria Design → Next.js Web
## PHASE 6: Authentication & Authorization

**Versión:** 1.0  
**Duración:** 1.5-2 horas  
**Objetivo:** Implementar login seguro, registro y control de acceso basado en roles

---

## 📋 Tabla de Contenidos

1. [Arquitectura de Auth](#arquitectura-de-auth)
2. [Backend Auth Integration](#backend-auth-integration)
3. [Frontend Auth Utilities](#frontend-auth-utilities)
4. [Login Page](#login-page)
5. [Register Page](#register-page)
6. [Session Management](#session-management)
7. [Protected Routes](#protected-routes)
8. [Role-Based Access Control](#role-based-access-control)
9. [CSRF Protection](#csrf-protection)
10. [Checklist de Phase 6](#checklist)

---

## Arquitectura de Auth

### Flujo de autenticación

```
┌─────────────────────────────────────────────────────────┐
│ Frontend (Next.js)                                      │
│  1. Usuario ingresa credenciales                        │
│  2. POST /api/auth/login (BFF)                         │
└──────────────────┬──────────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────────┐
│ Backend (FastAPI)                                       │
│  1. Valida email + password                             │
│  2. Genera JWT                                          │
│  3. Obtiene perfil del usuario                          │
│  4. Retorna JWT + datos de usuario                      │
└──────────────────┬──────────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────────┐
│ Frontend (Next.js)                                      │
│  1. Recibe JWT                                          │
│  2. Almacena en cookie HTTP-only                        │
│  3. Redirige según rol (admin→dashboard, cashier→sales) │
└─────────────────────────────────────────────────────────┘
```

### Componentes clave

- **JWT**: Token firmado que contiene usuario + role + permisos
- **HTTP-only cookies**: Almacenan el JWT de forma segura contra XSS
- **CSRF token**: Protege contra Cross-Site Request Forgery
- **Middleware**: Valida sesión en rutas protegidas
- **RLS (Row Level Security)**: Base de datos aislada por empresa/usuario

---

## Backend Auth Integration

### Supabase Auth Setup

**En `backend/.env`:**

```env
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxx...
SUPABASE_JWT_SECRET=your_jwt_secret_here
SUPABASE_JWKS_URL=https://xxxxx.supabase.co/auth/v1/keys
SUPABASE_JWT_ISSUER=https://xxxxx.supabase.co/auth/v1
SUPABASE_JWT_AUDIENCE=authenticated
SUPABASE_JWKS_CACHE_TTL_SECONDS=300
```

### JWT Validation Service

**`backend/src/services/supabase_auth.py`:**

```python
import json
from datetime import datetime
from typing import Optional
from functools import lru_cache
import jwt
import httpx
from fastapi import HTTPException, status

class SupabaseAuthService:
    """Servicio para validar JWTs de Supabase"""

    def __init__(
        self,
        jwt_secret: str,
        jwt_issuer: str,
        jwt_audience: str,
        jwks_url: str,
        jwks_cache_ttl: int = 300,
    ):
        self.jwt_secret = jwt_secret
        self.jwt_issuer = jwt_issuer
        self.jwt_audience = jwt_audience
        self.jwks_url = jwks_url
        self.jwks_cache_ttl = jwks_cache_ttl
        self._jwks_cache = None
        self._jwks_cached_at = None

    @lru_cache(maxsize=1)
    async def get_jwks(self) -> dict:
        """Obtiene las claves públicas de Supabase (con caché)"""
        now = datetime.now().timestamp()
        if (
            self._jwks_cache is not None
            and self._jwks_cached_at is not None
            and (now - self._jwks_cached_at) < self.jwks_cache_ttl
        ):
            return self._jwks_cache

        async with httpx.AsyncClient() as client:
            response = await client.get(self.jwks_url)
            response.raise_for_status()
            self._jwks_cache = response.json()
            self._jwks_cached_at = now

        return self._jwks_cache

    def verify_token(self, token: str) -> dict:
        """Verifica y decodifica un JWT"""
        try:
            # Decodificar sin verificación primero para obtener el header
            unverified = jwt.decode(token, options={"verify_signature": False})

            # Verificar firma usando la clave pública
            decoded = jwt.decode(
                token,
                key=self.jwt_secret,
                algorithms=["HS256"],
                audience=self.jwt_audience,
                issuer=self.jwt_issuer,
            )

            return decoded

        except jwt.ExpiredSignatureError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token expirado",
            )
        except jwt.InvalidTokenError as e:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=str(e),
            )

    def extract_user_id(self, token: str) -> str:
        """Extrae el user_id del JWT"""
        decoded = self.verify_token(token)
        return decoded.get("sub")

    def extract_role(self, token: str) -> Optional[str]:
        """Extrae el rol del JWT (si existe)"""
        decoded = self.verify_token(token)
        return decoded.get("user_metadata", {}).get("role")
```

### Endpoints de autenticación

**`backend/src/api/routes/auth.py`:**

```python
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from src.db.session import get_db
from src.models.profile import Profile
from src.services.supabase_auth import SupabaseAuthService
import os

router = APIRouter(prefix="/auth", tags=["auth"])

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    name: str

class AuthResponse(BaseModel):
    id: str
    email: str
    name: str
    role: str
    company_id: Optional[str]

@router.post("/login")
async def login(
    payload: LoginRequest,
    db: Session = Depends(get_db),
) -> AuthResponse:
    """Autentica un usuario y retorna su perfil"""
    
    # 1. Validar credenciales contra Supabase
    # (Normalmente usando Supabase Admin SDK)
    # Para este ejemplo, asumimos validación exitosa
    
    # 2. Buscar o crear perfil de usuario
    user = db.query(Profile).filter(Profile.email == payload.email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales incorrectas",
        )

    # 3. Generar JWT (normalmente Supabase lo hace)
    # Aquí asumimos que Supabase retorna un JWT válido
    
    return AuthResponse(
        id=user.id,
        email=user.email,
        name=user.name,
        role=user.role,
        company_id=user.company_id,
    )

@router.post("/register")
async def register(
    payload: RegisterRequest,
    db: Session = Depends(get_db),
) -> AuthResponse:
    """Registra un nuevo usuario"""
    
    # 1. Validar que no existe
    existing = db.query(Profile).filter(Profile.email == payload.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email ya registrado",
        )

    # 2. Crear en Supabase Auth
    # (Requiere Supabase Admin SDK)
    
    # 3. Crear perfil en base de datos
    new_user = Profile(
        id="generated_uuid",
        email=payload.email,
        name=payload.name,
        role="cashier",  # Rol por defecto
        company_id=None,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return AuthResponse(
        id=new_user.id,
        email=new_user.email,
        name=new_user.name,
        role=new_user.role,
        company_id=new_user.company_id,
    )

@router.get("/profile")
async def get_profile(
    db: Session = Depends(get_db),
    token: str = Depends(get_jwt_from_cookies),
) -> AuthResponse:
    """Obtiene el perfil del usuario autenticado"""
    
    # Validar token
    auth_service = get_auth_service()
    user_id = auth_service.extract_user_id(token)
    
    user = db.query(Profile).filter(Profile.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)

    return AuthResponse(
        id=user.id,
        email=user.email,
        name=user.name,
        role=user.role,
        company_id=user.company_id,
    )
```

---

## Frontend Auth Utilities

### Session Management

**`lib/auth.ts`:** Utilidades de autenticación en el cliente

```typescript
import { cookies } from 'next/headers';
import { jwtDecode } from 'jwt-decode';

const JWT_COOKIE_NAME = 'auth_token';
const JWT_COOKIE_MAX_AGE = 24 * 60 * 60; // 24 horas

/**
 * Obtiene el JWT almacenado en cookies (lado servidor)
 */
export async function getJWTFromCookies(): Promise<string | null> {
  const cookieStore = cookies();
  const token = cookieStore.get(JWT_COOKIE_NAME)?.value;
  return token || null;
}

/**
 * Decodifica un JWT sin validar (lado cliente, inseguro para datos críticos)
 */
export function decodeJWT<T = any>(token: string): T {
  return jwtDecode(token);
}

/**
 * Obtiene el user_id del JWT
 */
export function extractUserIdFromJWT(token: string): string {
  const decoded = decodeJWT<{ sub: string }>(token);
  return decoded.sub;
}

/**
 * Obtiene el rol del JWT
 */
export function extractRoleFromJWT(token: string): string {
  const decoded = decodeJWT<{ user_metadata?: { role: string } }>(token);
  return decoded.user_metadata?.role || 'cashier';
}

/**
 * Verifica si el JWT ha expirado
 */
export function isJWTExpired(token: string): boolean {
  try {
    const decoded = decodeJWT<{ exp: number }>(token);
    return Date.now() >= decoded.exp * 1000;
  } catch {
    return true;
  }
}

/**
 * Obtiene información del usuario desde el JWT (cliente)
 */
export function getUserInfoFromJWT(token: string) {
  const decoded = decodeJWT<{
    sub: string;
    email: string;
    user_metadata?: { name: string; role: string };
  }>(token);

  return {
    id: decoded.sub,
    email: decoded.email,
    name: decoded.user_metadata?.name || 'Usuario',
    role: decoded.user_metadata?.role || 'cashier',
  };
}
```

### Server-side Session Helper

**`lib/get-session.ts`:** Obtener sesión del servidor

```typescript
import { cookies } from 'next/headers';
import { jwtDecode } from 'jwt-decode';
import { redirect } from 'next/navigation';

const JWT_COOKIE_NAME = 'auth_token';

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'cashier';
}

/**
 * Obtiene la sesión actual (lado servidor)
 * Retorna null si no autenticado
 */
export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = cookies();
  const token = cookieStore.get(JWT_COOKIE_NAME)?.value;

  if (!token) return null;

  try {
    const decoded = jwtDecode<any>(token);
    return {
      id: decoded.sub,
      email: decoded.email,
      name: decoded.user_metadata?.name || 'Usuario',
      role: decoded.user_metadata?.role || 'cashier',
    };
  } catch {
    return null;
  }
}

/**
 * Wrapper para rutas protegidas
 * Redirige a login si no está autenticado
 */
export async function requireAuth(): Promise<SessionUser> {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  return session;
}

/**
 * Wrapper para rutas que requieren rol específico
 */
export async function requireRole(
  allowedRoles: ('admin' | 'cashier')[]
): Promise<SessionUser> {
  const session = await requireAuth();

  if (!allowedRoles.includes(session.role)) {
    redirect('/unauthorized');
  }

  return session;
}
```

---

## Login Page

**`app/login/page.tsx`:**

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { LoginScreen } from '@/components/LoginScreen';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async ({ email, password }: { email: string; password: string }) => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include', // Incluir cookies
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.detail || 'Credenciales incorrectas');
        return;
      }

      const { role } = await res.json();

      // Redirigir según rol
      if (role === 'admin') {
        router.push('/dashboard');
      } else {
        router.push('/salesRegister');
      }
    } catch (err) {
      setError('Error de conexión. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return <LoginScreen mode="login" onSubmit={handleSubmit} loading={loading} error={error} />;
}
```

---

## Register Page

**`app/registro/page.tsx`:**

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { LoginScreen } from '@/components/LoginScreen';

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async ({
    email,
    password,
    name,
  }: {
    email: string;
    password: string;
    name?: string;
  }) => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
        credentials: 'include',
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(
          data.detail === 'Email ya registrado'
            ? 'Este email ya está registrado'
            : 'Error al crear la cuenta'
        );
        return;
      }

      toast.success('Cuenta creada. ¡Bienvenido!');
      router.push('/salesRegister');
    } catch (err) {
      setError('Error de conexión. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LoginScreen mode="register" onSubmit={handleSubmit} loading={loading} error={error} />
  );
}
```

---

## Session Management

### BFF Auth Routes

**`app/api/auth/login/route.ts`:**

```typescript
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const { email, password } = await request.json();

  // Validar contra backend
  const res = await fetch(`${process.env.BACKEND_API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    return NextResponse.json(error, { status: res.status });
  }

  const { jwt, role } = await res.json();

  // Guardar JWT en cookie HTTP-only
  const response = NextResponse.json({ role });
  response.cookies.set('auth_token', jwt, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 24 * 60 * 60, // 24 horas
    path: '/',
  });

  return response;
}
```

**`app/api/auth/logout/route.ts`:**

```typescript
import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete('auth_token');
  return response;
}
```

**`app/api/auth/refresh/route.ts`:**

```typescript
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;

  if (!token) {
    return NextResponse.json({ error: 'No token' }, { status: 401 });
  }

  // Validar contra backend y obtener nuevo token si es necesario
  const res = await fetch(`${process.env.BACKEND_API_URL}/auth/refresh`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    return NextResponse.json({ error: 'Token invalid' }, { status: 401 });
  }

  const { jwt } = await res.json();

  const response = NextResponse.json({ success: true });
  response.cookies.set('auth_token', jwt, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 24 * 60 * 60,
    path: '/',
  });

  return response;
}
```

---

## Protected Routes

### Middleware para rutas protegidas

**`middleware.ts`:** (en la raíz del proyecto)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { jwtDecode } from 'jwt-decode';

const publicRoutes = ['/login', '/registro'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Rutas públicas
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next();
  }

  // Obtener token de cookies
  const token = request.cookies.get('auth_token')?.value;

  if (!token) {
    // Redirigir a login si no hay token
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  try {
    // Validar que el token sea válido
    const decoded = jwtDecode<{ exp: number }>(token);
    if (Date.now() >= decoded.exp * 1000) {
      // Token expirado
      const loginUrl = new URL('/login', request.url);
      return NextResponse.redirect(loginUrl);
    }
  } catch {
    // Token inválido
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

// Configurar qué rutas usan el middleware
export const config = {
  matcher: [
    // Proteger todo excepto estos
    '/((?!_next|api|static|public|login|registro).*)',
  ],
};
```

### Layout protegido

**`app/(dashboard)/layout.tsx`:**

```typescript
import { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/get-session';
import { Shell } from '@/components/Shell';

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  return <Shell role={session.role}>{children}</Shell>;
}
```

---

## Role-Based Access Control

### Componente condicional por rol

**`components/RoleGate.tsx`:**

```typescript
'use client';

import { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { getUserInfoFromJWT } from '@/lib/auth';

export const RoleGate = ({
  children,
  allowedRoles,
  fallback,
}: {
  children: ReactNode;
  allowedRoles: ('admin' | 'cashier')[];
  fallback?: ReactNode;
}) => {
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    // Obtener rol desde JWT en localStorage o cookie
    const token = document.cookie
      .split('; ')
      .find((row) => row.startsWith('auth_token='))
      ?.split('=')[1];

    if (token) {
      try {
        const userInfo = getUserInfoFromJWT(token);
        setRole(userInfo.role);
      } catch {
        setRole(null);
      }
    }
  }, []);

  if (!role) return fallback;

  return allowedRoles.includes(role as any) ? children : fallback;
};
```

---

## CSRF Protection

### Generar y validar CSRF tokens

**`lib/csrf.ts`:**

```typescript
import crypto from 'crypto';

export function generateCSRFToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function validateCSRFToken(token: string, storedToken: string): boolean {
  return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(storedToken));
}
```

### Middleware CSRF

**`app/api/middleware/csrf.ts`:**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { validateCSRFToken } from '@/lib/csrf';

export function withCSRFProtection(handler: Function) {
  return async (request: NextRequest) => {
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method)) {
      const csrfToken = request.headers.get('x-csrf-token');
      const sessionToken = request.cookies.get('csrf_token')?.value;

      if (!csrfToken || !sessionToken || !validateCSRFToken(csrfToken, sessionToken)) {
        return NextResponse.json({ error: 'CSRF token invalid' }, { status: 403 });
      }
    }

    return handler(request);
  };
}
```

---

## Checklist

- [ ] Backend endpoints `/auth/login`, `/auth/register`, `/auth/profile` funcionan
- [ ] JWT validation en backend implementado
- [ ] BFF routes `/api/auth/login`, `/api/auth/logout` creadas
- [ ] JWT almacenado en HTTP-only cookies
- [ ] Middleware de protección de rutas funcionando
- [ ] LoginScreen integrado en `/login`
- [ ] RegisterScreen integrado en `/registro`
- [ ] Redirección según rol (admin → dashboard, cashier → sales)
- [ ] Token refresh automático implementado
- [ ] CSRF protection en mutaciones
- [ ] Error handling de credenciales incorrectas
- [ ] Test de login/logout flow funciona

---

**Estado:** ✅ Phase 6 Complete  
**Duración estimada:** 1.5-2 horas  
**Siguiente:** Phase 7 - Routing & Navigation
