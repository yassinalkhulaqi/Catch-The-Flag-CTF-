"use client";

import { useEffect, useId, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

/**
 * Styled listbox. Native keyboard: arrows, Home/End, Enter, Escape, typeahead.
 * The underlying value is a real input so forms can read it.
 */
export function Select({
  id,
  name,
  label,
  value,
  defaultValue = "",
  options,
  onValueChange,
  disabled,
  placeholder = "Select",
  className,
}: {
  id?: string;
  name?: string;
  label: string;
  value?: string;
  defaultValue?: string;
  options: SelectOption[];
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}) {
  const autoId = useId();
  const buttonId = id ?? autoId;
  const listId = `${buttonId}-listbox`;
  const [open, setOpen] = useState(false);
  const [internal, setInternal] = useState(defaultValue);
  const [active, setActive] = useState(0);
  const selected = value ?? internal;
  const rootRef = useRef<HTMLDivElement>(null);
  const current = options.find((option) => option.value === selected);

  useEffect(() => {
    if (!open) return;
    function onPointer(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onPointer);
    return () => document.removeEventListener("mousedown", onPointer);
  }, [open]);

  function commit(next: string) {
    if (value === undefined) setInternal(next);
    onValueChange?.(next);
    setOpen(false);
  }

  function onKeyDown(event: React.KeyboardEvent) {
    if (disabled) return;
    const enabled = options.map((option, index) => ({ option, index })).filter((item) => !item.option.disabled);
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      setOpen(true);
      const direction = event.key === "ArrowDown" ? 1 : -1;
      const position = enabled.findIndex((item) => item.index === active);
      const next = enabled[(position + direction + enabled.length) % enabled.length];
      if (next) setActive(next.index);
    } else if (event.key === "Home") {
      event.preventDefault();
      setActive(enabled[0]?.index ?? 0);
    } else if (event.key === "End") {
      event.preventDefault();
      setActive(enabled[enabled.length - 1]?.index ?? 0);
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (!open) setOpen(true);
      else if (!options[active]?.disabled) commit(options[active].value);
    } else if (event.key === "Escape") {
      setOpen(false);
    } else if (event.key.length === 1) {
      const match = options.findIndex(
        (option) => !option.disabled && option.label.toLowerCase().startsWith(event.key.toLowerCase()),
      );
      if (match >= 0) setActive(match);
    }
  }

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <input type="hidden" name={name} value={selected} />
      <button
        id={buttonId}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={current ? `${label}: ${current.label}` : label}
        className="flex h-10 w-full items-center justify-between rounded-md border border-border bg-background px-3 text-start text-sm text-foreground shadow-sm disabled:opacity-50"
        onClick={() => setOpen((state) => !state)}
        onKeyDown={onKeyDown}
      >
        <span className={current ? "" : "text-faint"}>{current?.label ?? placeholder}</span>
        <span aria-hidden="true" className="text-faint">
          ▾
        </span>
      </button>
      {open ? (
        <ul
          id={listId}
          role="listbox"
          aria-label={label}
          className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border border-border bg-surface-overlay p-1 shadow-md"
        >
          {options.map((option, index) => (
            <li
              key={option.value}
              id={`${listId}-${option.value}`}
              role="option"
              aria-selected={option.value === selected}
              aria-disabled={option.disabled || undefined}
              className={cn(
                "cursor-pointer rounded px-2 py-1.5 text-sm",
                index === active && "bg-surface-raised",
                option.value === selected && "text-accent",
                option.disabled && "pointer-events-none opacity-40",
              )}
              onMouseEnter={() => setActive(index)}
              onMouseDown={(event) => {
                event.preventDefault();
                if (!option.disabled) commit(option.value);
              }}
            >
              {option.label}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
