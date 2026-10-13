"use client";

import { useEffect, useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Kbd } from "@/components/ui/kbd";
import { isTypingTarget } from "@/lib/a11y/shortcut";
import { useDictionary } from "@/lib/i18n";

export function ShortcutsDialog() {
  const copy = useDictionary();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const helpKey = event.key === "?" || (event.key === "/" && event.shiftKey);
      if (!helpKey || event.metaKey || event.ctrlKey || event.altKey) return;
      if (isTypingTarget(event.target)) return;
      event.preventDefault();
      setOpen(true);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <Dialog open={open} onClose={() => setOpen(false)} title={copy.shortcuts.title}>
      <ul className="space-y-2 text-sm">
        <li className="flex items-center justify-between gap-4">
          <span>{copy.shortcuts.command}</span>
          <span className="inline-flex gap-1">
            <Kbd>Ctrl</Kbd>
            <Kbd>K</Kbd>
          </span>
        </li>
        <li className="flex items-center justify-between gap-4">
          <span>{copy.shortcuts.help}</span>
          <Kbd>Shift+?</Kbd>
        </li>
        <li className="flex items-center justify-between gap-4">
          <span>{copy.shortcuts.skip}</span>
          <span className="text-muted">{copy.skip}</span>
        </li>
      </ul>
    </Dialog>
  );
}
