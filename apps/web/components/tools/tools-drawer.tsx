"use client";

import { Suspense, lazy, useEffect, useId, useRef, useState } from "react";
import { Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Lazy-load tab panels so the drawer shell stays light until opened.
const DecoderTool = lazy(() =>
  import("@/components/tools/decoder-tool").then((m) => ({ default: m.DecoderTool })),
);
const PayloadCheatsheet = lazy(() =>
  import("@/components/tools/payload-cheatsheet").then((m) => ({ default: m.PayloadCheatsheet })),
);
const RequestSandbox = lazy(() =>
  import("@/components/tools/request-sandbox").then((m) => ({ default: m.RequestSandbox })),
);

type ToolTab = "decoder" | "cheatsheet" | "sandbox";

const TABS: { id: ToolTab; label: string }[] = [
  { id: "decoder", label: "Decoder" },
  { id: "cheatsheet", label: "Cheatsheet" },
  { id: "sandbox", label: "Sandbox" },
];

export function ToolsDrawer() {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const dialogId = `tools-drawer-${uid}`;
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<ToolTab>("decoder");
  const panelRef = useRef<HTMLDivElement>(null);

  // Focus the panel when the drawer opens for keyboard / screen-reader users.
  useEffect(() => {
    if (open) panelRef.current?.focus();
  }, [open ]);

  // Escape closes the drawer from anywhere inside it.
  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open ]);

  return (
    <>
      <Button
        type="button"
        data-testid="tools-drawer-fab"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={dialogId}
        onClick={() => setOpen(true)}
        className="fixed right-4 bottom-4 z-40 shadow-lg"
      >
        <span aria-hidden="true" className="inline-flex"><Wrench className="size-4" /></span> Tools
      </Button>

      {open ? (
        <div className="fixed inset-0 z-50" data-testid="tools-drawer">
          <button
            type="button"
            aria-label="Close tools panel"
            data-testid="tools-drawer-overlay"
            onClick={() => setOpen(false)}
            className="absolute inset-0 cursor-default bg-black/50"
          />
          <div
            ref={panelRef}
            id={dialogId}
            role="dialog"
            aria-modal="true"
            aria-label="Security tools"
            tabIndex={-1}
            className="absolute top-0 right-0 flex h-full w-full max-w-md flex-col border-l border-border bg-surface shadow-xl focus:outline-none"
          >
            <div className="flex items-center justify-between gap-2 border-b border-border p-4">
              <h2 className="text-sm font-semibold text-foreground">Security tools</h2>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                data-testid="tools-drawer-close"
                onClick={() => setOpen(false)}
              >
                Close
              </Button>
            </div>

            <div role="tablist" aria-label="Tool" className="flex gap-1 border-b border-border px-4">
              {TABS.map((item) => {
                const selected = item.id === tab;
                return (
                  <button
                    key={item.id}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    data-testid={`tools-drawer-tab-${item.id}`}
                    onClick={() => setTab(item.id)}
                    className={cn(
                      "border-b-2 px-3 py-2 text-sm",
                      selected
                        ? "border-accent text-foreground"
                        : "border-transparent text-muted hover:text-foreground",
                    )}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>

            <div
              role="tabpanel"
              tabIndex={0}
              data-testid="tools-drawer-panel"
              className="flex-1 overflow-y-auto p-4"
            >
              <Suspense fallback={<p className="text-sm text-muted">Loading tool…</p>}>
                {tab === "decoder" ? <DecoderTool /> : null}
                {tab === "cheatsheet" ? <PayloadCheatsheet /> : null}
                {tab === "sandbox" ? <RequestSandbox /> : null}
              </Suspense>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
