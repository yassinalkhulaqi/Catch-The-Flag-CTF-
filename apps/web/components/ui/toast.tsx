"use client";

import { AlertTriangle, CheckCircle2, Info, X, XCircle } from "lucide-react";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
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

const DURATION = 4500;

const icons = {
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  danger: XCircle,
} as const;

const iconTones: Record<ToastTone, string> = {
  info: "text-info",
  success: "text-success",
  warning: "text-warning",
  danger: "text-danger",
};

const barTones: Record<ToastTone, string> = {
  info: "bg-info",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const timers = useRef<Map<number, number>>(new Map());

  const dismiss = useCallback((id: number) => {
    const timer = timers.current.get(id);
    if (timer) window.clearTimeout(timer);
    timers.current.delete(id);
    setItems((current) => current.filter((item) => item.id !== id));
  }, []);

  const push = useCallback(
    (toast: Omit<ToastItem, "id">) => {
      const id = Date.now() + Math.floor(Math.random() * 1000);
      setItems((current) => [...current, { ...toast, id }].slice(-4));
      timers.current.set(
        id,
        window.setTimeout(() => dismiss(id), DURATION),
      );
    },
    [dismiss],
  );

  useEffect(() => {
    const pending = timers.current;
    return () => {
      pending.forEach((timer) => window.clearTimeout(timer));
      pending.clear();
    };
  }, []);

  const api = useMemo(() => ({ push }), [push]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        className="pointer-events-none fixed bottom-4 end-4 z-[80] flex w-[min(100%-2rem,22rem)] flex-col gap-2"
        aria-live="polite"
        aria-relevant="additions"
      >
        {items.map((item) => {
          const Icon = icons[item.tone];
          return (
            <div
              key={item.id}
              role={item.tone === "danger" ? "alert" : "status"}
              className={cn(
                "pointer-events-auto relative overflow-hidden rounded-xl border bg-surface/95 px-3 py-2.5 shadow-lg backdrop-blur animate-toast-in",
                item.tone === "success" && "border-success/40",
                item.tone === "warning" && "border-warning/40",
                item.tone === "danger" && "border-danger/40",
                item.tone === "info" && "border-border",
              )}
            >
              <div className="flex items-start gap-2.5">
                <Icon aria-hidden="true" className={cn("mt-0.5 size-4 shrink-0", iconTones[item.tone])} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground">{item.title}</p>
                  {item.description ? (
                    <p className="mt-0.5 text-xs leading-relaxed text-muted">{item.description}</p>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={() => dismiss(item.id)}
                  aria-label="Dismiss notification"
                  className="-me-1 -mt-1 rounded-md p-1 text-faint transition-colors hover:bg-surface-raised hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
                >
                  <X aria-hidden="true" className="size-3.5" />
                </button>
              </div>
              <span
                aria-hidden="true"
                className={cn(
                  "absolute inset-x-0 bottom-0 h-0.5 origin-left motion-reduce:hidden",
                  barTones[item.tone],
                )}
                style={{ animation: `ctf-toast-life ${DURATION}ms linear forwards` }}
              />
            </div>
          );
        })}
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
