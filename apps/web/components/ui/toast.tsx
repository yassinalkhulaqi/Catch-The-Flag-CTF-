"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { cn } from "@/lib/utils";

type ToastTone = "info" | "success" | "warning" | "danger";

interface ToastItem {
  id: number;
  title: string;
  description?: string;
  tone: ToastTone;
}

interface ToastApi {
  push: (toast: Omit<ToastItem, "id">) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const push = useCallback((toast: Omit<ToastItem, "id">) => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setItems((current) => [...current, { ...toast, id }].slice(-4));
    window.setTimeout(() => {
      setItems((current) => current.filter((item) => item.id !== id));
    }, 4500);
  }, []);

  const api = useMemo(() => ({ push }), [push]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        className="pointer-events-none fixed bottom-4 end-4 z-[80] flex w-[min(100%-2rem,22rem)] flex-col gap-2"
        aria-live="polite"
      >
        {items.map((item) => (
          <div
            key={item.id}
            role={item.tone === "danger" ? "alert" : "status"}
            className={cn(
              "pointer-events-auto rounded-lg border bg-surface px-3 py-2 shadow-md animate-pop",
              item.tone === "success" && "border-success/40",
              item.tone === "warning" && "border-warning/40",
              item.tone === "danger" && "border-danger/40",
              item.tone === "info" && "border-border",
            )}
          >
            <p className="text-sm font-semibold text-foreground">{item.title}</p>
            {item.description ? <p className="text-xs text-muted">{item.description}</p> : null}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const context = useContext(ToastContext);
  if (!context) {
    return { push: () => undefined };
  }
  return context;
}
