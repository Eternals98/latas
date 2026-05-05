"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";

export type MultiSelectOption = {
  id: string;
  name: string;
};

type Props = {
  label: string;
  options: MultiSelectOption[];
  selectedIds: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  chipClassName?: string;
};

function toggleValue(values: string[], value: string): string[] {
  return values.includes(value)
    ? values.filter((entry) => entry !== value)
    : [...values, value];
}

function FeatherChevronDown({ className = "h-4 w-4" }: { className?: string }) {
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
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function FeatherCheck({ className = "h-4 w-4" }: { className?: string }) {
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
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function FeatherX({ className = "h-3 w-3" }: { className?: string }) {
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

export function MultiSelectCombobox({
  label,
  options,
  selectedIds,
  onChange,
  placeholder = "Seleccionar",
  chipClassName = "border-[#D6DDF5] bg-[#F7F9FF] text-[#003D9B]",
}: Props) {
  const instanceId = useId();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const closeTimeoutRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const [open, setOpen] = useState(false);
  const [renderMenu, setRenderMenu] = useState(false);

  const clearTimers = useCallback(() => {
    if (closeTimeoutRef.current !== null) {
      window.clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }

    if (animationFrameRef.current !== null) {
      window.cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, []);

  const closeMenu = useCallback(() => {
    clearTimers();

    setOpen(false);

    closeTimeoutRef.current = window.setTimeout(() => {
      setRenderMenu(false);
      closeTimeoutRef.current = null;
    }, 180);
  }, [clearTimers]);

  const openMenu = useCallback(() => {
    clearTimers();

    document.dispatchEvent(
      new CustomEvent("multi-select-open", {
        detail: instanceId,
      })
    );

    setRenderMenu(true);

    animationFrameRef.current = window.requestAnimationFrame(() => {
      setOpen(true);
      animationFrameRef.current = null;
    });
  }, [clearTimers, instanceId]);

  const toggleMenu = useCallback(() => {
    if (open) {
      closeMenu();
      return;
    }

    openMenu();
  }, [closeMenu, open, openMenu]);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      const target = event.target as Node | null;

      if (!target || !rootRef.current?.contains(target)) {
        closeMenu();
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeMenu();
      }
    }

    document.addEventListener("pointerdown", handlePointerDown, true);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown, true);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [closeMenu]);

  useEffect(() => {
    function handleOtherSelectOpen(event: Event) {
      const customEvent = event as CustomEvent<string>;

      if (customEvent.detail !== instanceId) {
        closeMenu();
      }
    }

    document.addEventListener("multi-select-open", handleOtherSelectOpen);

    return () => {
      document.removeEventListener("multi-select-open", handleOtherSelectOpen);
    };
  }, [closeMenu, instanceId]);

  useEffect(() => {
    return () => {
      clearTimers();
    };
  }, [clearTimers]);

  const selectedOptions = selectedIds
    .map((id) => options.find((option) => option.id === id))
    .filter((value): value is MultiSelectOption => Boolean(value));

  const visibleSelectedOptions = selectedOptions.slice(0, 2);
  const hiddenSelectedCount = selectedOptions.length - visibleSelectedOptions.length;

  return (
    <div ref={rootRef} className="relative w-full overflow-visible font-sans">
      <div
        className={`rounded-[4px] border bg-[#F7F9FF] shadow-[0px_0px_15px_rgba(0,0,0,0.09)] transition-all duration-200 ease-out ${
          open
            ? "border-[#B8C7F0] ring-1 ring-[#D6DDF5]"
            : "border-slate-200 hover:border-slate-300"
        }`}
      >
        <div
          role="button"
          tabIndex={0}
          aria-label={label}
          aria-expanded={open}
          aria-haspopup="listbox"
          onClick={toggleMenu}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              toggleMenu();
            }
          }}
          className="group flex h-8 w-full cursor-pointer items-center text-left outline-none"
        >
          <div className="flex min-w-0 flex-1 items-center gap-1 overflow-hidden px-3">
            {selectedOptions.length > 0 ? (
              <>
                {visibleSelectedOptions.map((option) => (
                  <span
                    key={option.id}
                    className={`inline-flex h-5 max-w-full shrink-0 items-center gap-1 rounded-full border px-2 text-[14px] font-medium leading-none tracking-[-0.01em] ${chipClassName}`}
                  >
                    <span className="max-w-[150px] truncate">{option.name}</span>

                    <button
                      type="button"
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        onChange(toggleValue(selectedIds, option.id));
                      }}
                      className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-current transition-all duration-150 hover:bg-black/5 active:scale-90"
                      aria-label={`Quitar ${option.name}`}
                    >
                      <FeatherX className="h-3 w-3" />
                    </button>
                  </span>
                ))}

                {hiddenSelectedCount > 0 && (
                  <span className="inline-flex h-5 shrink-0 items-center rounded-full border border-slate-200 bg-[#F7F9FF] px-2 text-[14px] font-medium leading-none text-slate-500">
                    +{hiddenSelectedCount}
                  </span>
                )}
              </>
            ) : (
              <span className="truncate text-[14px] font-medium leading-none tracking-[-0.01em] text-slate-400">
                {placeholder}
              </span>
            )}
          </div>

          <div className="flex h-full w-8 shrink-0 items-center justify-center border-l border-slate-200 text-slate-500 transition-colors duration-150 group-hover:text-slate-700">
            <FeatherChevronDown
              className={`h-4 w-4 transition-transform duration-200 ease-out ${
                open ? "rotate-180" : "rotate-0"
              }`}
            />
          </div>
        </div>
      </div>

      {renderMenu && (
        <div
          className={`absolute left-0 top-full z-50 mt-1 w-full origin-top overflow-hidden rounded-md border border-slate-200 bg-white shadow-[0px_12px_28px_rgba(15,23,42,0.14)] transition-all duration-200 ease-out will-change-transform ${
            open
              ? "pointer-events-auto translate-y-0 scale-100 opacity-100"
              : "pointer-events-none -translate-y-1 scale-[0.98] opacity-0"
          }`}
        >
          <div
            role="listbox"
            aria-label={label}
            className="flex max-h-72 flex-col gap-4 overflow-auto p-2"
          >
            {options.map((option) => {
              const selected = selectedIds.includes(option.id);

              return (
                <button
                  key={option.id}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={(event) => {
                    event.stopPropagation();
                    onChange(toggleValue(selectedIds, option.id));
                  }}
                  className={`relative flex h-8 w-full select-none items-center rounded-lg pl-7 pr-9 text-left text-[13px] font-medium leading-none tracking-[-0.01em] outline-none transition-all duration-150 ease-out ${
                    selected
                      ? "bg-[#F7F9FF] text-[#003D9B] ring-1 ring-[#D6DDF5]"
                      : "text-slate-700 hover:scale-[1.01] hover:bg-slate-100 hover:text-slate-950 focus-visible:bg-slate-100 active:scale-[0.99] active:bg-slate-200"
                  }`}
                >
                  <span className="ml-2 truncate">{option.name}</span>

                  {selected && (
                    <span className="absolute right-3 top-1/2 flex h-4 w-4 -translate-y-1/2 items-center justify-center text-[#003D9B]">
                      
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
