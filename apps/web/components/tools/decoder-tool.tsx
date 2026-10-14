"use client";

import { useId, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Textarea } from "@/components/ui/input";
import {
  base64Decode,
  base64Encode,
  hexDecode,
  hexEncode,
  htmlEscape,
  htmlUnescape,
  jwtInspect,
  urlDecode,
  urlEncode,
  type CodecMode,
} from "@/lib/tools-codec";
import { cn } from "@/lib/utils";

const MODES: { id: CodecMode; label: string; hint: string }[] = [
  { id: "url", label: "URL", hint: "Percent-encoding for query strings and paths." },
  { id: "base64", label: "Base64", hint: "UTF-8 safe Base64 for tokens and blobs." },
  { id: "hex", label: "Hex", hint: "Lowercase hex of the UTF-8 bytes." },
  { id: "html", label: "HTML", hint: "Escape or unescape markup characters." },
  { id: "jwt", label: "JWT", hint: "Decode header + payload. Signature is never verified." },
];

function transform(mode: CodecMode, direction: "encode" | "decode", value: string): string {
  switch (mode) {
    case "url":
      return direction === "encode" ? urlEncode(value) : urlDecode(value);
    case "base64":
      return direction === "encode" ? base64Encode(value) : base64Decode(value);
    case "hex":
      return direction === "encode" ? hexEncode(value) : hexDecode(value);
    case "html":
      return direction === "encode" ? htmlEscape(value) : htmlUnescape(value);
    case "jwt": {
      const result = jwtInspect(value);
      if (result.error) throw new Error(result.error);
      return JSON.stringify(
        { _note: "unverified — signature is never checked", header: result.header, payload: result.payload },
        null,
        2,
      );
    }
  }
}

export function DecoderTool() {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const inputId = `decoder-input-${uid}`;
  const outputId = `decoder-output-${uid}`;
  const [mode, setMode] = useState<CodecMode>("url");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const active = MODES.find((m) => m.id === mode)!;
  const isJwt = mode === "jwt";

  function run(direction: "encode" | "decode") {
    setCopied(false);
    try {
      setOutput(transform(mode, direction, input));
      setError(null);
    } catch (err) {
      setOutput("");
      setError(err instanceof Error ? err.message : "Could not convert that input.");
    }
  }

  async function copyOutput() {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <Card data-testid="decoder-tool">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-foreground">Encoder / decoder</h2>
        <Badge tone="neutral">100% offline</Badge>
      </div>

      <div role="tablist" aria-label="Codec mode" className="flex flex-wrap gap-1 border-b border-border">
        {MODES.map((m) => {
          const selected = m.id === mode;
          return (
            <button
              key={m.id}
              type="button"
              role="tab"
              aria-selected={selected}
              data-testid={`decoder-mode-${m.id}`}
              onClick={() => {
                setMode(m.id);
                setError(null);
                setCopied(false);
              }}
              className={cn(
                "border-b-2 px-3 py-2 text-sm",
                selected
                  ? "border-accent text-foreground"
                  : "border-transparent text-muted hover:text-foreground",
              )}
            >
              {m.label}
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-xs text-muted">{active.hint}</p>

      <div className="mt-4 space-y-4">
        <Field label="Input" htmlFor={inputId}>
          <Textarea
            id={inputId}
            data-testid="decoder-input"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder={isJwt ? "Paste a JWT (header.payload.signature)…" : "Paste text to convert…"}
            rows={4}
            spellCheck={false}
          />
        </Field>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            data-testid="decoder-encode"
            disabled={isJwt || input.trim() === ""}
            title={isJwt ? "JWTs can only be inspected, not encoded here" : undefined}
            onClick={() => run("encode")}
          >
            Encode
          </Button>
          <Button type="button" variant="secondary" data-testid="decoder-decode" onClick={() => run("decode")}>
            {isJwt ? "Inspect JWT" : "Decode"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            data-testid="decoder-copy"
            disabled={!output}
            onClick={copyOutput}
            aria-live="polite"
          >
            {copied ? "Copied" : "Copy output"}
          </Button>
        </div>

        {error ? (
          <p role="alert" data-testid="decoder-error" className="text-sm text-danger">
            {error}
          </p>
        ) : null}

        <Field label={isJwt ? "Decoded payload (unverified)" : "Output"} htmlFor={outputId}>
          <Textarea
            id={outputId}
            data-testid="decoder-output"
            value={output}
            readOnly
            rows={4}
            spellCheck={false}
            placeholder={isJwt ? "Header and payload JSON will appear here…" : "Result will appear here…"}
            aria-live="polite"
          />
        </Field>
        {isJwt ? (
          <p className="text-xs text-muted">
            Unverified: this decodes the token body only. The signature is never checked, so never trust
            it for access decisions.
          </p>
        ) : null}
      </div>
    </Card>
  );
}
