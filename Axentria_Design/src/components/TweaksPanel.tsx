'use client';

import React, { useState } from 'react';
import { Icon, cn } from './Primitives';

export const TweaksPanel = ({ title, children }: { title: string, children: React.ReactNode }) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed right-5 bottom-5 z-[9999] flex flex-col items-end gap-3">
      {open && (
        <div className="w-[300px] bg-white rounded-xl shadow-elev-3 border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="px-5 py-4 bg-paper-50 border-b border-slate-200 flex justify-between items-center">
            <span className="text-[11px] tracking-overline uppercase font-bold text-slate-500">{title}</span>
            <button onClick={() => setOpen(false)} className="p-1 hover:bg-paper-200 rounded-md transition-colors text-slate-400">
              <Icon name="x" size={16} />
            </button>
          </div>
          <div className="p-5 flex flex-col gap-5">
            {children}
          </div>
        </div>
      )}
      <button 
        onClick={() => setOpen(!open)} 
        className={cn(
          "w-12 h-12 rounded-full grid place-items-center shadow-elev-3 cursor-pointer transition-all active:scale-95",
          open ? "bg-brass-400 text-ink-900" : "bg-ink-900 text-paper-50"
        )}
      >
        <Icon name="settings" size={20} className={cn(open && "animate-spin-slow")} />
      </button>
    </div>
  );
};

export const TweakSection = ({ label, children }: { label: string, children: React.ReactNode }) => (
  <div className="flex flex-col gap-2.5">
    <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">{label}</div>
    {children}
  </div>
);

export const TweakRadio = ({ label, value, options, onChange }: { label: string, value: string, options: string[], onChange: (v: string) => void }) => (
  <div className="flex flex-col gap-1.5">
    <div className="text-xs font-semibold text-ink-900">{label}</div>
    <div className="flex gap-1 flex-wrap">
      {options.map(opt => (
        <button 
          key={opt} 
          onClick={() => onChange(opt)} 
          className={cn(
            "px-2 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer border",
            value === opt 
              ? "bg-brass-400 text-ink-900 border-brass-400 shadow-sm" 
              : "bg-paper-200 text-slate-600 border-transparent hover:bg-paper-300"
          )}
        >
          {opt}
        </button>
      ))}
    </div>
  </div>
);

export const TweakToggle = ({ label, value, onChange }: { label: string, value: boolean, onChange: (v: boolean) => void }) => (
  <div className="flex justify-between items-center">
    <div className="text-xs font-semibold text-ink-900">{label}</div>
    <button 
      onClick={() => onChange(!value)} 
      className={cn(
        "w-9 h-5 rounded-full relative transition-colors cursor-pointer",
        value ? "bg-sage-500" : "bg-slate-300"
      )}
    >
      <div className={cn(
        "absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all",
        value ? "left-4.5" : "left-0.5"
      )} />
    </button>
  </div>
);
