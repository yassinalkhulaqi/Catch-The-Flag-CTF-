"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input, Textarea } from "@/components/ui/input";

/*
 * SIMULATED request builder. This component never calls fetch(),
 * XMLHttpRequest, sendBeacon, or any BFF/API helper: the "response" is a
 * canned string computed locally so learners can practise shaping HTTP
 * requests with zero network traffic (V1 is a static platform with no
 * live lab infrastructure).
 */

const METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"] as const;
type Method = (typeof METHODS)[number];

const STATUS_TEXT: Record<number, string> = {
  200: "OK",
  201: "Created",
  204: "No Content",
  403: "Forbidden",
  404: "Not Found",
  422: "Unprocessable Entity",
};

const STATUS_BY_METHOD: Record<Method, number> = {
  GET: 200,
  POST: 201,
  PUT: 200,
  PATCH: 200,
  DELETE: 204,
  HEAD: 200,
  OPTIONS: 204,
};

/** Pick a deterministic canned status from the method + path only. */
export function simulateStatus(method: Method, path: string, body: string): number {
  const target = path.toLowerCase();
  if (target.includes("/admin")) return 403;
  if (target.includes("not-found") || target.includes("missing")) return 404;
  if ((method === "POST" || method === "PUT" || method === "PATCH") && body.trim() === "") {
    return 422;
  }
  return STATUS_BY_METHOD[method] ?? 200;
}

function countHeaderLines(raw: string): number {
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0).length;
}

function buildSimulatedResponse(
  method: Method,
  path: string,
  headersRaw: string,
  paramsRaw: string,
  body: string,
): string {
  const status = simulateStatus(method, path, body);
  const params = paramsRaw
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && line.includes("="));
  const query = params.length > 0 ? `?${params.join("&")}` : "";
  const lines = [
    `HTTP/1.1 ${status} ${STATUS_TEXT[status] ?? ""} (simulated, local only)`,
    ``,
    `> ${method} ${path || "/"}${query}`,
    `headers: ${countHeaderLines(headersRaw)} line(s) parsed locally · params: ${params.length} · body: ${new TextEncoder().encode(body).length} byte(s)`,
  ];
  if (method === "DELETE" && status === 204) {
    lines.push("resource would be deleted on a real server — nothing happened here.");
  } else if (status === 403) {
    lines.push("hint: paths under /admin are forbidden in this simulation.");
  } else if (status === 404) {
    lines.push("hint: this path does not exist in this simulation.");
  } else if (status === 422) {
    lines.push("hint: mutating methods expect a request body in this simulation.");
  } else if (body.trim() !== "") {
    lines.push(`echo: ${body.trim().slice(0, 280)}`);
  } else {
    lines.push("echo: (empty body)");
  }
  return lines.join("\n");
}

const SEND_DELAY_MS = 350;
const TYPE_INTERVAL_MS = 10;
const TYPE_CHUNK = 8;

export function RequestSandbox() {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const methodId = `sandbox-method-${uid}`;
  const pathId = `sandbox-path-${uid}`;
  const headersId = `sandbox-headers-${uid}`;
  const paramsId = `sandbox-params-${uid}`;
  const bodyId = `sandbox-body-${uid}`;
  const responseId = `sandbox-response-${uid}`;

  const [method, setMethod] = useState<Method>("GET");
  const [path, setPath] = useState("/api/v1/challenges");
  const [headers, setHeaders] = useState("Accept: application/json");
  const [params, setParams] = useState("per_page=5");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [typed, setTyped] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    const stash = timers.current;
    return () => {
      for (const timer of stash) window.clearTimeout(timer);
      stash.length = 0;
    };
  }, []);

  function clearTimers() {
    for (const timer of timers.current) window.clearTimeout(timer);
    timers.current.length = 0;
  }

  function handleSend() {
    clearTimers();
    setSending(true);
    setTyped(null);
    setDone(false);
    const full = buildSimulatedResponse(method, path, headers, params, body);
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    if (reduced) {
      timers.current.push(
        window.setTimeout(() => {
          setTyped(full);
          setDone(true);
          setSending(false);
        }, SEND_DELAY_MS),
      );
      return;
    }
    // Small delay, then a typing effect that reveals the canned text.
    timers.current.push(
      window.setTimeout(() => {
        let shown = 0;
        const step = () => {
          shown = Math.min(full.length, shown + TYPE_CHUNK);
          setTyped(full.slice(0, shown));
          if (shown < full.length) {
            timers.current.push(window.setTimeout(step, TYPE_INTERVAL_MS));
          } else {
            setDone(true);
            setSending(false);
          }
        };
        step();
      }, SEND_DELAY_MS),
    );
  }

  return (
    <Card data-testid="request-sandbox">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-foreground">Request sandbox</h2>
        <Badge tone="warning">Simulated — no real requests leave the browser</Badge>
      </div>
      <p role="note" className="rounded-md border border-warning/40 bg-warning/10 px-3 py-2 text-sm text-foreground">
        Simulated: everything below runs locally. Pressing send never contacts a server — the response
        is a canned echo computed in your browser.
      </p>

      <div className="mt-4 grid gap-4 sm:grid-cols-[140px_1fr]">
        <Field label="Method" htmlFor={methodId}>
          <select
            id={methodId}
            data-testid="sandbox-method"
            value={method}
            onChange={(event) => setMethod(event.target.value as Method)}
            className="flex h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground shadow-sm focus-visible:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            {METHODS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Path" htmlFor={pathId} hint="Same-origin style path only. Nothing is fetched.">
          <Input
            id={pathId}
            data-testid="sandbox-path"
            value={path}
            onChange={(event) => setPath(event.target.value)}
            placeholder="/api/v1/challenges"
            spellCheck={false}
            autoComplete="off"
          />
        </Field>
      </div>

      <div className="mt-4 space-y-4">
        <Field label="Headers" htmlFor={headersId} hint='One per line, e.g. "Accept: application/json". Parsed locally.'>
          <Textarea
            id={headersId}
            data-testid="sandbox-headers"
            value={headers}
            onChange={(event) => setHeaders(event.target.value)}
            rows={3}
            spellCheck={false}
            placeholder={"Accept: application/json\nX-Lesson: sqli-01"}
          />
        </Field>
        <Field label="Body" htmlFor={bodyId} hint="Echoed back in the simulated response.">
          <Textarea
            id={bodyId}
            data-testid="sandbox-body"
            value={body}
            onChange={(event) => setBody(event.target.value)}
            rows={4}
            spellCheck={false}
            placeholder='{"flag": "flag{…}"}'
          />
        </Field>
        <Field label="Query params" htmlFor={paramsId} hint='One per line as key=value. Appended to the echoed path.'>
          <Textarea
            id={paramsId}
            data-testid="sandbox-params"
            value={params}
            onChange={(event) => setParams(event.target.value)}
            rows={2}
            spellCheck={false}
            autoComplete="off"
            placeholder={"per_page=5\ncategory=sqli"}
          />
        </Field>

        <div>
          <Button
            type="button"
            data-testid="sandbox-send"
            disabled={sending}
            aria-busy={sending || undefined}
            onClick={handleSend}
          >
            {sending ? "Simulating…" : "Send (simulated)"}
          </Button>
        </div>

        <div>
          <span id={`${responseId}-label`} className="text-sm font-medium text-foreground">
            Simulated response
          </span>
          <pre
            id={responseId}
            data-testid="sandbox-response"
            role="status"
            aria-labelledby={`${responseId}-label`}
            aria-live="polite"
            className="mt-1.5 min-h-28 overflow-x-auto rounded-md border border-border bg-background p-3 font-mono text-xs whitespace-pre-wrap text-foreground"
          >
            {typed ?? (sending ? "Simulating request…" : "Press “Send (simulated)” to preview a canned response.")}
            {sending && !done ? " ▍" : ""}
          </pre>
        </div>
      </div>
    </Card>
  );
}
