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
    <div className="paper-grain min-h-full grid place-items-center p-8 bg-paper-100">
      <div className="w-[440px] font-sans animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex flex-col items-center justify-center mb-8">
          <div className="w-[72px] h-[72px] rounded-[20px] bg-ink-900 grid place-items-center shadow-3 p-3.5 mb-5">
            <BrandMark color="var(--paper-50)" size={42} />
          </div>
          <div className="text-center">
            <BrandLogo height={32} color="var(--ink-900)" className="mb-2" />
            <div className="text-base text-slate-500 font-display italic">
              El libro de ventas, hecho aplicación.
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-8 pb-7 border border-slate-200 shadow-3 relative overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-brass-400" />
          <div className="text-[11px] tracking-overline uppercase font-semibold text-slate-500 mb-6">
            {isRegister ? 'Crear cuenta' : 'Acceso al sistema'}
          </div>

          {error && (
            <div className="flex items-center gap-3 bg-coral-50 border border-coral-500/30 text-coral-700 p-4 rounded-lg mb-6">
              <Icon name="x" size={16} />
              <span className="text-sm">{error}</span>
            </div>
          )}

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

            <div>
              <div className="flex justify-between mb-1.5">
                <label className="text-xs font-bold text-ink-900">Contraseña</label>
                {!isRegister && (
                  <a href="#" className="text-[11px] text-brass-600 font-semibold hover:underline">
                    ¿Olvidó su clave?
                  </a>
                )}
              </div>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                prefix={<Icon name="settings" size={16} className="rotate-45" />}
              />
            </div>

            <Button
              type="submit"
              size="lg"
              className="mt-3 w-full"
              disabled={!canSubmit || loading}
              icon={loading ? 'spinner' : 'chevronRight'}
            >
              {loading
                ? isRegister
                  ? 'Creando cuenta...'
                  : 'Ingresando...'
                : isRegister
                  ? 'Crear cuenta y entrar'
                  : 'Ingresar al panel'}
            </Button>
          </form>

          <div className="h-px bg-slate-200 my-7" />

          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-sage-500" />
              <span className="text-[11px] text-slate-500">Sistema operativo</span>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">v 4.2.1 · POS-01</span>
          </div>
        </div>
      </div>
    </div>
  );
};
