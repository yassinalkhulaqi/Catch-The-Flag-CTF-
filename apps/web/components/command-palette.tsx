"use client";

import { useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { trapTabKey } from "@/lib/a11y/focus";
import { api } from "@/lib/api/client";
import { useDictionary } from "@/lib/i18n";
import { withViewTransition } from "@/lib/motion/view-transition";
import type { ChallengeSummary, Paginated } from "@/lib/types";

interface RemoteHit {
  id: string;
  label: string;
  hint: string;
  href: string;
}

interface CommandApi {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const CommandContext = createContext<CommandApi | null>(null);

const LINKS = [
  { href: "/dashboard", label: "Dashboard", hint: "Account" },
  { href: "/challenges", label: "Challenges", hint: "Catalog" },
  { href: "/paths", label: "Learning paths", hint: "Catalog" },
  { href: "/leaderboard", label: "Leaderboard", hint: "Progress" },
  { href: "/achievements", label: "Achievements", hint: "Account" },
  { href: "/notifications", label: "Notifications", hint: "Account" },
  { href: "/settings", label: "Settings", hint: "Account" },
  { href: "/about", label: "About", hint: "Product" },
];

export function CommandProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((current) => !current);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const apiValue = useMemo(() => ({ open, setOpen }), [open]);

  return (
    <CommandContext.Provider value={apiValue}>
      {children}
      <CommandDialog open={open} onClose={() => setOpen(false)} />
    </CommandContext.Provider>
  );
}

export function useCommandPalette(): CommandApi {
  const context = useContext(CommandContext);
  if (!context) return { open: false, setOpen: () => undefined };
  return context;
}

function CommandDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const copy = useDictionary();
  const titleId = useId();
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [fetched, setFetched] = useState<{ needle: string; items: RemoteHit[] }>({
    needle: "",
    items: [],
  });
  const [seenOpen, setSeenOpen] = useState(open);
  if (open !== seenOpen) {
    setSeenOpen(open);
    if (!open) {
      setQuery("");
      setActive(0);
      setFetched({ needle: "", items: [] });
    }
  }
  const needle = query.trim();
  const remote = open && needle.length >= 2 && fetched.needle === needle ? fetched.items : [];

  const links = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return LINKS;
    return LINKS.filter((link) => link.label.toLowerCase().includes(needle));
  }, [query]);

  const options = [
    ...links.map((link) => ({ id: link.href, label: link.label, hint: link.hint, href: link.href })),
    ...remote,
  ];

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    inputRef.current?.focus();
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
      previous?.focus();
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open || needle.length < 2) return;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const [challenges, paths] = await Promise.all([
          api.get<Paginated<ChallengeSummary>>(
            `/challenges?q=${encodeURIComponent(needle)}&per_page=5`,
            { signal: controller.signal },
          ),
          api.get<Paginated<{ id: number; title: string; slug: string }>>(
            `/paths?q=${encodeURIComponent(needle)}&per_page=5`,
            { signal: controller.signal },
          ),
        ]);
        setFetched({
          needle,
          items: [
            ...challenges.data.map((challenge) => ({
              id: `challenge-${challenge.id}`,
              label: challenge.title,
              hint: challenge.category.name,
              href: `/challenges/${challenge.slug}`,
            })),
            ...paths.data.map((path) => ({
              id: `path-${path.id}`,
              label: path.title,
              hint: "Path",
              href: `/paths/${path.slug}`,
            })),
          ],
        });
      } catch {
        if (!controller.signal.aborted) setFetched({ needle, items: [] });
      }
    }, 180);
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [needle, open]);

  function close() {
    setQuery("");
    setActive(0);
    setFetched({ needle: "", items: [] });
    onClose();
  }

  function go(href: string) {
    close();
    withViewTransition(() => router.push(href));
  }

  const current = options.length === 0 ? 0 : Math.min(active, options.length - 1);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-start justify-center px-4 pt-[12vh]">
        <button type="button" aria-label={copy.command.close} className="absolute inset-0 bg-background/70" onClick={close} />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 w-full max-w-xl overflow-hidden rounded-xl border border-border bg-surface shadow-lg"
      >
        <h2 id={titleId} className="sr-only">
          {copy.command.title}
        </h2>
        <input
          ref={inputRef}
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setActive(0);
          }}
          placeholder={copy.command.placeholder}
          aria-controls={listId}
          aria-activedescendant={options[current] ? `${listId}-${options[current].id}` : undefined}
          className="w-full border-b border-border bg-transparent px-4 py-3 text-sm outline-none"
          onKeyDown={(event) => {
            if (event.key === "ArrowDown") {
              event.preventDefault();
              setActive((index) => Math.min(options.length - 1, index + 1));
            } else if (event.key === "ArrowUp") {
              event.preventDefault();
              setActive((index) => Math.max(0, index - 1));
            } else if (event.key === "Enter" && options[current]) {
              event.preventDefault();
              go(options[current].href);
            }
          }}
        />
        <ul id={listId} role="listbox" aria-label="Results" className="max-h-80 overflow-auto p-1">
          {options.length === 0 ? (
            <li className="px-3 py-6 text-sm text-muted">{copy.command.empty}</li>
          ) : (
            options.map((option, index) => (
              <li key={option.id} id={`${listId}-${option.id}`} role="option" aria-selected={index === current}>
                <button
                  type="button"
                  className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-start text-sm ${
                    index === current ? "bg-surface-raised" : ""
                  }`}
                  onMouseEnter={() => setActive(index)}
                  onClick={() => go(option.href)}
                >
                  <span>{option.label}</span>
                  <span className="font-mono text-[11px] text-faint">{option.hint}</span>
                </button>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>,
    document.body,
  );
}
