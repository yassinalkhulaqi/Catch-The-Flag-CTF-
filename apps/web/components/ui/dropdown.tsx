"use client";

import { useEffect, useId, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export interface MenuItem {
  id: string;
  label: string;
  onSelect: () => void;
  disabled?: boolean;
}

export function DropdownMenu({
  label,
  trigger,
  items,
}: {
  label: string;
  trigger: React.ReactNode;
  items: MenuItem[];
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    function onPointer(event: MouseEvent) {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onPointer);
    return () => document.removeEventListener("mousedown", onPointer);
  }, [open]);

  function onKeyDown(event: React.KeyboardEvent) {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      setOpen(true);
      const direction = event.key === "ArrowDown" ? 1 : -1;
      setActive((index) => (index + direction + items.length) % items.length);
    } else if (event.key === "Enter" || event.key === " ") {
      if (!open) {
        event.preventDefault();
        setOpen(true);
        return;
      }
      const item = items[active];
      if (item && !item.disabled) {
        event.preventDefault();
        item.onSelect();
        setOpen(false);
      }
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div ref={ref} className="relative inline-flex" onKeyDown={onKeyDown}>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={label}
        onClick={() => setOpen((state) => !state)}
        className="inline-flex"
      >
        {trigger}
      </button>
      {open ? (
        <div
          id={menuId}
          role="menu"
          aria-label={label}
          className="absolute end-0 top-full z-50 mt-1 min-w-44 rounded-md border border-border bg-surface-overlay p-1 shadow-md"
        >
          {items.map((item, index) => (
            <button
              key={item.id}
              type="button"
              role="menuitem"
              disabled={item.disabled}
              className={cn(
                "block w-full rounded px-2 py-1.5 text-start text-sm",
                index === active ? "bg-surface-raised" : "hover:bg-surface-raised",
              )}
              onMouseEnter={() => setActive(index)}
              onClick={() => {
                item.onSelect();
                setOpen(false);
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
