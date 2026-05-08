'use client';

import React, { useState } from 'react';
import { Icon, Input, Button, BrandMark, BrandLogo } from './Primitives';

export const LoginScreen = ({ onSignIn }: { onSignIn: () => void }) => {
  const [email, setEmail] = useState("admin@axentria.com");
  const [pass, setPass]   = useState("password");
  const [err, setErr]     = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !pass) { setErr(true); return; }
    onSignIn();
  };

  return (
    <div className="paper-grain min-h-full grid place-items-center p-8 bg-paper-100">
      <div className="w-[440px] font-sans animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex flex-col items-center justify-center mb-8">
          <div className="w-[72px] h-[72px] rounded-[20px] bg-ink-900 grid place-items-center shadow-elev-3 p-3.5 mb-5">
            <BrandMark color="var(--paper-50)" size={42} />
          </div>
          <div className="text-center">
            <BrandLogo height={32} color="var(--ink-900)" className="mb-2" />
            <div className="text-base text-slate-500 font-display italic">
              El libro de ventas, hecho aplicación.
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-8 pb-7 border border-slate-200 shadow-elev-3 relative overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-brass-400" />
          <div className="text-[11px] tracking-overline uppercase font-semibold text-slate-500 mb-6">Acceso al sistema</div>
          <form onSubmit={submit} className="flex flex-col gap-[18px]">
            <Input 
              label="Correo electrónico" 
              value={email} 
              onChange={e => { setEmail(e.target.value); setErr(false); }}
              placeholder="nombre@empresa.com" 
              prefix={<Icon name="user" size={16} />} 
            />
            <div>
              <div className="flex justify-between mb-1.5">
                <label className="text-xs font-bold text-ink-900">Contraseña</label>
                <a href="#" className="text-[11px] text-brass-600 font-semibold hover:underline">¿Olvidó su clave?</a>
              </div>
              <Input 
                type="password" 
                value={pass} 
                onChange={e => { setPass(e.target.value); setErr(false); }}
                placeholder="••••••••••••" 
                error={err && "Credenciales incorrectas"} 
                prefix={<Icon name="settings" size={16} className="rotate-45" />} 
              />
            </div>
            <Button type="submit" size="lg" className="mt-3 w-full">
              Ingresar al panel <Icon name="chevronRight" size={16} className="ml-1" />
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
