"use client";

import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { FocusProgress } from "@/components/challenge/focus-progress";
import { FocusRail } from "@/components/challenge/focus-rail";
import { FocusToggle } from "@/components/challenge/focus-toggle";
import { SessionTimer } from "@/components/challenge/session-timer";
import {
  focusProgress,
  parseChecklist,
  serializeChecklist,
  toggleChecklist,
  type FocusSection,
} from "@/lib/challenge/focus";
import type { Dictionary } from "@/lib/i18n/en";
import { usePrefersReducedMotion } from "@/lib/motion/reduced";
import { cn } from "@/lib/utils";

const focusListeners = new Set<() => void>();
const serverFalse = () => false;
const serverNull = () => null;

function subscribeFocus(onChange: () => void) {
  focusListeners.add(onChange);
  return () => {
    focusListeners.delete(onChange);
  };
}

function readFocus(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeFocus(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {}
  focusListeners.forEach((listener) => listener());
}

export function FocusShell({
  challengeId,
  title,
  sections,
  copy,
  children,
}: {
  challengeId: number;
  title: string;
  sections: FocusSection[];
  copy: Dictionary["focus"];
  children: React.ReactNode;
}) {
  const reduced = usePrefersReducedMotion();
  const activeKey = `ctf:focus:${challengeId}:active`;
  const doneKey = `ctf:focus:${challengeId}:done`;

  const activeSnapshot = useCallback(() => readFocus(activeKey) === "1", [activeKey]);
  const doneSnapshot = useCallback(() => readFocus(doneKey), [doneKey]);
  const active = useSyncExternalStore(subscribeFocus, activeSnapshot, serverFalse);
  const doneRaw = useSyncExternalStore(subscribeFocus, doneSnapshot, serverNull);
  const completed = useMemo(() => parseChecklist(doneRaw), [doneRaw]);

  const [seconds, setSeconds] = useState(0);
  const [activeSection, setActiveSection] = useState<string>(sections[0]?.key ?? "");

  const progress = useMemo(
    () => focusProgress(completed, sections),
    [completed, sections],
  );

  useEffect(() => {
    if (!active) return;
    const timer = window.setInterval(() => setSeconds((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, [active]);

  useEffect(() => {
    if (!active || typeof IntersectionObserver === "undefined") return;
    const nodes = sections
      .map((section) => document.getElementById(section.id))
      .filter((node): node is HTMLElement => node !== null);
    if (nodes.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) {
          setActiveSection(visible[0].target.id.replace(/^focus-/, ""));
        }
      },
      { rootMargin: "-15% 0px -70% 0px", threshold: 0 },
    );
    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [active, sections]);

  const jump = useCallback(
    (section: FocusSection) => {
      const node = document.getElementById(section.id);
      node?.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
      setActiveSection(section.key);
    },
    [reduced],
  );

  const toggleDone = useCallback(
    (key: string) => {
      const current = parseChecklist(readFocus(doneKey));
      writeFocus(doneKey, serializeChecklist(toggleChecklist(current, key)));
    },
    [doneKey],
  );

  function toggleFocus() {
    writeFocus(activeKey, active ? "0" : "1");
    setSeconds(0);
    setActiveSection(sections[0]?.key ?? "");
  }

  return (
    <div data-focus={active ? "true" : "false"} className={cn(active && "focus-active")}>
      {active ? (
        <>
          <div className="sticky top-16 z-40 -mx-4 mb-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-border bg-background/90 px-4 py-2 backdrop-blur">
            <span className="type-eyebrow text-accent">{copy.title}</span>
            <span className="hidden min-w-0 max-w-[22rem] truncate text-sm font-medium text-foreground sm:block">
              {title}
            </span>
            <SessionTimer seconds={seconds} label={copy.timer} />
            <FocusProgress
              count={progress.count}
              total={progress.total}
              percent={progress.percent}
              label={copy.reviewed}
              completeLabel={copy.complete}
              className="ms-auto hidden w-40 md:block"
            />
            <FocusToggle active onToggle={toggleFocus} copy={copy} className="ms-auto md:ms-0" />
          </div>

          <div
            aria-label={copy.rail}
            className="mb-4 flex gap-1.5 overflow-x-auto lg:hidden"
          >
            {sections.map((section) => (
              <button
                key={section.key}
                type="button"
                onClick={() => jump(section)}
                aria-current={activeSection === section.key ? "location" : undefined}
                className={cn(
                  "shrink-0 rounded-md border px-2.5 py-1.5 text-xs transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60",
                  activeSection === section.key
                    ? "border-accent/40 bg-accent/10 text-accent"
                    : "border-border bg-surface text-muted hover:text-foreground",
                )}
              >
                {section.label}
              </button>
            ))}
          </div>
        </>
      ) : null}

      <div className={cn(active && "lg:flex lg:gap-6")}>
        <div className="min-w-0 flex-1">{children}</div>

        {active ? (
          <aside className="hidden w-56 shrink-0 lg:block">
            <div className="sticky top-32 rounded-2xl border border-border bg-surface/70 p-4">
              <FocusRail
                sections={sections}
                activeSection={activeSection}
                completed={completed}
                progress={progress}
                onJump={jump}
                onToggle={toggleDone}
                copy={copy}
              />
            </div>
          </aside>
        ) : null}
      </div>

      {!active ? (
        <div className="fixed bottom-4 end-4 z-40">
          <FocusToggle active={false} onToggle={toggleFocus} copy={copy} />
        </div>
      ) : null}
    </div>
  );
}
