"use client";

import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { focusableElements, trapTabKey } from "@/lib/a11y/focus";
import { cn } from "@/lib/utils";

/** Side panel. Anchored to the inline end so it mirrors in RTL. */
export function Sheet({
  open,
  onClose,
  title,
  children,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    focusableElements(panelRef.current)[0]?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      trapTabKey(event, panelRef.current);
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
      previous?.focus();
    };
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[60]">
      <button type="button" aria-label="Close panel" className="absolute inset-0 bg-background/70" onClick={onClose} />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn(
          "absolute inset-y-0 end-0 flex w-full max-w-md flex-col border-s border-border bg-surface p-5 shadow-lg",
          className,
        )}
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 id={titleId} className="font-display text-lg font-semibold">
            {title}
          </h2>
          <button type="button" onClick={onClose} className="text-sm text-muted hover:text-foreground">
            Close
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
