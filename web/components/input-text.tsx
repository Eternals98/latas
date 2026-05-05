"use client";

import { ReactNode, useEffect, useMemo, useRef, useState } from "react";

export type SearchModalItem = {
  id: string;
  title: string;
  description?: string;
  badge?: string;
  icon?: ReactNode;
};

type SearchModalProps = {
  open: boolean;
  onClose: () => void;
  items: SearchModalItem[];
  onSelect: (item: SearchModalItem) => void;
  title?: string;
  placeholder?: string;
};

function SearchIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  );
}

function XIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function ArrowIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  );
}

export function SearchModal({
  open,
  onClose,
  items,
  onSelect,
  title = "Buscar",
  placeholder = "Buscar por nombre, cliente, venta, producto...",
}: SearchModalProps) {
  const modalRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!open) {
      setQuery("");
      return;
    }

    const timeout = window.setTimeout(() => {
      inputRef.current?.focus();
    }, 80);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [open]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    if (open) {
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      const target = event.target as Node | null;

      if (!target || !modalRef.current?.contains(target)) {
        onClose();
      }
    }

    if (open) {
      document.addEventListener("pointerdown", handlePointerDown, true);
    }

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown, true);
    };
  }, [open, onClose]);

  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return items;
    }

    return items.filter((item) => {
      const searchableText = [
        item.title,
        item.description,
        item.badge,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(normalizedQuery);
    });
  }, [items, query]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[999] flex items-start justify-center bg-slate-950/35 px-4 pt-[12vh] font-sans backdrop-blur-[2px]">
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="w-full max-w-2xl origin-top animate-[searchModalIn_180ms_ease-out] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0px_24px_70px_rgba(15,23,42,0.24)]"
      >
        <div className="border-b border-slate-100 px-5 py-4">
          <div className="mb-3 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-[15px] font-bold tracking-[-0.02em] text-slate-900">
                {title}
              </h2>
              <p className="mt-1 text-[12px] font-medium text-slate-500">
                Encuentra rápidamente registros del sistema
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition-all duration-150 hover:scale-105 hover:bg-slate-100 hover:text-slate-900 active:scale-95"
              aria-label="Cerrar búsqueda"
            >
              <XIcon className="h-4 w-4" />
            </button>
          </div>

          <div className="flex h-11 items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 text-slate-500 transition-all duration-200 focus-within:border-blue-300 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-100">
            <SearchIcon className="h-4 w-4 shrink-0" />

            <input
              ref={inputRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={placeholder}
              className="h-full min-w-0 flex-1 bg-transparent text-[14px] font-medium tracking-[-0.01em] text-slate-900 outline-none placeholder:text-slate-400"
            />

            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-slate-400 transition-colors duration-150 hover:bg-slate-200 hover:text-slate-700"
                aria-label="Limpiar búsqueda"
              >
                <XIcon className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        <div className="max-h-[420px] overflow-auto p-3">
          {filteredItems.length > 0 ? (
            <div className="flex flex-col gap-1.5">
              {filteredItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    onSelect(item);
                    onClose();
                  }}
                  className="group flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left outline-none transition-all duration-150 ease-out hover:scale-[1.01] hover:bg-slate-100 focus-visible:bg-slate-100 active:scale-[0.99]"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-[#003D9B]">
                    {item.icon ?? <SearchIcon className="h-4 w-4" />}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex min-w-0 items-center gap-2">
                      <p className="truncate text-[14px] font-semibold tracking-[-0.01em] text-slate-900">
                        {item.title}
                      </p>

                      {item.badge && (
                        <span className="shrink-0 rounded-full border border-blue-100 bg-blue-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#003D9B]">
                          {item.badge}
                        </span>
                      )}
                    </div>

                    {item.description && (
                      <p className="mt-1 truncate text-[12px] font-medium tracking-[-0.01em] text-slate-500">
                        {item.description}
                      </p>
                    )}
                  </div>

                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-400 opacity-0 transition-all duration-150 group-hover:bg-white group-hover:text-[#003D9B] group-hover:opacity-100">
                    <ArrowIcon className="h-4 w-4" />
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="flex min-h-[180px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 px-6 py-8 text-center">
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400">
                <SearchIcon className="h-5 w-5" />
              </div>

              <p className="text-[14px] font-bold tracking-[-0.01em] text-slate-900">
                Sin resultados
              </p>

              <p className="mt-1 max-w-sm text-[12px] font-medium leading-5 text-slate-500">
                No encontramos coincidencias para tu búsqueda. Intenta con otro nombre,
                código o descripción.
              </p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50 px-5 py-3">
          <p className="text-[11px] font-medium text-slate-500">
            Presiona{" "}
            <span className="rounded-md border border-slate-200 bg-white px-1.5 py-0.5 font-bold text-slate-700">
              Esc
            </span>{" "}
            para cerrar
          </p>

          <p className="text-[11px] font-semibold text-slate-400">
            {filteredItems.length} resultado{filteredItems.length === 1 ? "" : "s"}
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes searchModalIn {
          from {
            opacity: 0;
            transform: translateY(-8px) scale(0.98);
          }

          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>
  );
}