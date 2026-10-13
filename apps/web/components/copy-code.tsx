"use client";

import { useState } from "react";

export function CopyCode({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="absolute end-2 top-2 rounded border border-border bg-background px-2 py-1 font-mono text-[11px] text-muted hover:text-foreground"
    >
      {copied ? "Copied" : "Copy"}
    </button>
  );
}
