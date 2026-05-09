'use client';

import React, { useState } from 'react';
import { Icon, Input, Button, BrandMark, BrandLogo } from './Primitives';

export type LoginScreenProps = {
  mode?: 'login' | 'register';
  onSubmit: (data: { email: string; password: string; name?: string }) => Promise<void>;
  loading: boolean;
  error: string | null;
};

export const LoginScreen = ({
  mode = 'login',
  onSubmit,
  loading,
  error,
}: LoginScreenProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const isRegister = mode === 'register';
  const canSubmit = email && password && (!isRegister || name);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    await onSubmit({
      email,
      password,
      name: isRegister ? name : undefined,
    });
  };

  return (
    <div className="grid min-h-full p-8 paper-grain place-items-center bg-paper-100">
      <div className="w-[440px] font-sans animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Header */}
        <div className="flex flex-col items-center justify-center mb-8">
          <div className="w-[72px] h-[72px] rounded-[20px] bg-ink-900 grid place-items-center shadow-3 p-3.5 mb-5">
            <BrandMark color="var(--paper-50)" size={42} />
          </div>
          <div className="text-center">
            <BrandLogo height={32} color="var(--ink-900)" className="mb-2" />
            <div className="text-base italic text-slate-500 font-display">
              El libro de ventas, hecho aplicación.
            </div>
          </div>
        </div>

        {/* Card */}
        <div className="relative p-8 overflow-hidden bg-white border rounded-2xl pb-7 border-slate-200 shadow-3">
          <div className="absolute top-0 bottom-0 left-0 w-1 bg-brass-400" />
          <div className="text-[11px] tracking-overline uppercase font-semibold text-slate-500 mb-6">
            {isRegister ? 'Crear cuenta' : 'Acceso al sistema'}
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-3 p-4 mb-6 border rounded-lg bg-coral-50 border-coral-500/30 text-coral-700">
              <Icon name="x" size={16} />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={submit} className="flex flex-col gap-[18px]">
            {isRegister && (
              <Input
                label="Nombre completo"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Juan Pérez"
                prefix={<Icon name="user" size={16} />}
              />
            )}

            <Input
              label="Correo electrónico"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nombre@empresa.com"
              prefix={<Icon name="user" size={16} />}
            />

            <Input
              label="Contraseña"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              prefix={<Icon name="lock" size={16} />}
            />

            <Button
              type="submit"
              variant="accent"
              size="lg"
              disabled={!canSubmit || loading}
              className="mt-2"
            >
              {loading ? 'Entrando...' : isRegister ? 'Crear cuenta' : 'Entrar'}
            </Button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-xs text-center text-slate-500">
            {isRegister ? (
              <>
                ¿Ya tienes cuenta?{' '}
                <a href="/login" className="font-semibold text-brass-600 hover:text-brass-700">
                  Inicia sesión
                </a>
              </>
            ) : (
              <>
                ¿No tienes cuenta?{' '}
                <a href="/registro" className="font-semibold text-brass-600 hover:text-brass-700">
                  Crea una
                </a>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};