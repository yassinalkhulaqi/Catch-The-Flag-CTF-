import * as React from "react";

/**
 * Minimal safe Markdown renderer for lesson content.
 *
 * No `dangerouslySetInnerHTML`, no dependencies. Safety comes from React
 * itself: every text node is rendered as a React child (auto-escaped), and
 * link destinations are allow-listed by `isSafeUrl`. Raw HTML in the source
 * is therefore always displayed as literal text, never parsed.
 *
 * Supported block syntax: ATX headings (#–######), fenced code blocks
 * (```), unordered lists (-, *, +), ordered lists (1. / 1)), and paragraphs.
 * Supported inline syntax: links [text](url), inline `code`, **bold**, *italic*.
 */

/* ---------- HTML escaping (for tests / non-React consumers) ---------- */

/** Escape the five HTML-significant characters. */
export function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/* ---------- safe URLs ---------- */

/**
 * Allow http(s) URLs, same-origin absolute paths, anchors, query strings,
 * and scheme-less relative URLs. Reject everything with a dangerous scheme
 * (javascript:, data:, vbscript:, file:, …) or embedded whitespace/control
 * characters.
 */
export function isSafeUrl(href: string): boolean {
  const value = href.trim();
  if (value === "" || /[\s<>]/.test(value)) return false;
  const scheme = /^[a-zA-Z][a-zA-Z0-9+.-]*:/.exec(value);
  if (!scheme) return true; // relative URL, anchor, or query string
  const name = scheme[0].slice(0, -1).toLowerCase();
  return name === "http" || name === "https";
}

/* ---------- AST ---------- */

export type InlineNode =
  | { type: "text"; text: string }
  | { type: "code"; text: string }
  | { type: "strong"; children: InlineNode[] }
  | { type: "em"; children: InlineNode[] }
  | { type: "link"; text: string; href: string | null };

export type MarkdownBlock =
  | { type: "heading"; level: 1 | 2 | 3 | 4 | 5 | 6; children: InlineNode[] }
  | { type: "paragraph"; children: InlineNode[] }
  | { type: "code"; language: string | null; code: string }
  | { type: "list"; ordered: boolean; items: InlineNode[][] };

const LINK_RE = /\[([^\]]*)\]\(((?:[^()]|\([^()]*\))*)\)/;
const INLINE_TOKEN_RE =
  /(`[^`\n]+`|\*\*[^*\n]+\*\*|\*[^*\n]+\*|\[[^\]]*\]\((?:[^()]|\([^()]*\))*\))/;

function parseInlineChildren(source: string): InlineNode[] {
  const out: InlineNode[] = [];
  for (const token of source.split(INLINE_TOKEN_RE)) {
    if (token === "") continue;
    if (token.startsWith("`") && token.endsWith("`") && token.length >= 2) {
      out.push({ type: "code", text: token.slice(1, -1) });
      continue;
    }
    if (token.startsWith("**") && token.endsWith("**") && token.length >= 5) {
      out.push({
        type: "strong",
        children: [{ type: "text", text: token.slice(2, -2) }],
      });
      continue;
    }
    if (token.startsWith("*") && token.endsWith("*") && token.length >= 3) {
      out.push({
        type: "em",
        children: [{ type: "text", text: token.slice(1, -1) }],
      });
      continue;
    }
    const link = LINK_RE.exec(token);
    if (link && token === link[0]) {
      const href = link[2].trim();
      out.push({
        type: "link",
        text: link[1],
        href: isSafeUrl(href) ? href : null,
      });
      continue;
    }
    out.push({ type: "text", text: token });
  }
  return out;
}

/** Split Markdown source into safe blocks. Never throws — degrades to paragraphs. */
export function parseMarkdown(source: string): MarkdownBlock[] {
  const lines = source.replace(/\r\n?/g, "\n").split("\n");
  const blocks: MarkdownBlock[] = [];
  let paragraph: string[] = [];
  let listItems: string[] | null = null;
  let listOrdered = false;
  let codeFence: { language: string | null; lines: string[] } | null = null;

  function flushParagraph() {
    if (paragraph.length === 0) return;
    blocks.push({
      type: "paragraph",
      children: parseInlineChildren(paragraph.join(" ")),
    });
    paragraph = [];
  }

  function flushList() {
    if (!listItems || listItems.length === 0) {
      listItems = null;
      return;
    }
    blocks.push({
      type: "list",
      ordered: listOrdered,
      items: listItems.map((item) => parseInlineChildren(item)),
    });
    listItems = null;
  }

  for (const raw of lines) {
    const line = raw;

    if (codeFence) {
      if (/^```\s*$/.test(line.trim())) {
        blocks.push({
          type: "code",
          language: codeFence.language,
          code: codeFence.lines.join("\n"),
        });
        codeFence = null;
      } else {
        codeFence.lines.push(line);
      }
      continue;
    }

    const fence = /^```(\S*)\s*$/.exec(line.trim());
    if (fence) {
      flushParagraph();
      flushList();
      codeFence = {
        language: fence[1] === "" ? null : fence[1],
        lines: [],
      };
      continue;
    }

    if (/^\s*$/.test(line)) {
      flushParagraph();
      flushList();
      continue;
    }

    const heading = /^(#{1,6})\s+(.+?)\s*#*\s*$/.exec(line);
    if (heading) {
      flushParagraph();
      flushList();
      blocks.push({
        type: "heading",
        level: heading[1].length as 1 | 2 | 3 | 4 | 5 | 6,
        children: parseInlineChildren(heading[2]),
      });
      continue;
    }

    const unordered = /^\s*[-*+]\s+(.+)$/.exec(line);
    if (unordered) {
      flushParagraph();
      if (!listItems || listOrdered) {
        flushList();
        listItems = [];
        listOrdered = false;
      }
      listItems.push(unordered[1]);
      continue;
    }

    const ordered = /^\s*\d+[.)]\s+(.+)$/.exec(line);
    if (ordered) {
      flushParagraph();
      if (!listItems || !listOrdered) {
        flushList();
        listItems = [];
        listOrdered = true;
      }
      listItems.push(ordered[1]);
      continue;
    }

    flushList();
    paragraph.push(line.trim());
  }

  if (codeFence) {
    // Unclosed fence: render what was collected as a code block.
    blocks.push({
      type: "code",
      language: codeFence.language,
      code: codeFence.lines.join("\n"),
    });
  }
  flushParagraph();
  flushList();
  return blocks;
}

/* ---------- rendering (React-escaped, no dangerouslySetInnerHTML) ---------- */

function renderInline(nodes: InlineNode[], keyPrefix: string): React.ReactNode[] {
  return nodes.map((node, i) => {
    const key = `${keyPrefix}-${i}`;
    switch (node.type) {
      case "code":
        return React.createElement(
          "code",
          {
            key,
            className:
              "rounded bg-surface-raised px-1 py-0.5 font-mono text-[0.85em] text-accent",
          },
          node.text,
        );
      case "strong":
        return React.createElement(
          "strong",
          { key },
          node.children.map((c, j) =>
            React.createElement(
              React.Fragment,
              { key: `${key}-${j}` },
              c.type === "text" ? c.text : null,
            ),
          ),
        );
      case "em":
        return React.createElement(
          "em",
          { key },
          node.children.map((c, j) =>
            React.createElement(
              React.Fragment,
              { key: `${key}-${j}` },
              c.type === "text" ? c.text : null,
            ),
          ),
        );
      case "link":
        if (node.href === null)
          return React.createElement(React.Fragment, { key }, node.text);
        return React.createElement(
          "a",
          {
            key,
            href: node.href,
            className:
              "text-accent underline underline-offset-2 hover:text-accent-hover",
          },
          node.text,
        );
      default:
        return React.createElement(React.Fragment, { key }, node.text);
    }
  });
}

const HEADING_CLASS: Record<number, string> = {
  1: "mt-8 text-2xl font-semibold tracking-tight text-foreground",
  2: "mt-8 text-xl font-semibold tracking-tight text-foreground",
  3: "mt-6 text-lg font-semibold text-foreground",
  4: "mt-6 text-base font-semibold text-foreground",
  5: "mt-4 text-sm font-semibold text-foreground",
  6: "mt-4 font-mono text-xs uppercase tracking-widest text-muted",
};

/** Render lesson Markdown as React elements. Returns null for blank input. */
export function MarkdownContent({ content }: { content: string }) {
  const blocks = parseMarkdown(content);
  if (blocks.length === 0) return null;
  return React.createElement(
    React.Fragment,
    null,
    blocks.map((block, i) => {
      switch (block.type) {
        case "heading":
          return React.createElement(
            `h${block.level}`,
            { key: i, className: HEADING_CLASS[block.level] },
            renderInline(block.children, `h${i}`),
          );
        case "code":
          return React.createElement(
            "pre",
            {
              key: i,
              className:
                "mt-4 overflow-x-auto rounded-lg border border-border bg-surface-raised p-4 font-mono text-xs leading-relaxed text-foreground",
            },
            React.createElement("code", null, block.code),
          );
        case "list":
          return React.createElement(
            block.ordered ? "ol" : "ul",
            {
              key: i,
              className: block.ordered
                ? "mt-4 list-decimal space-y-1.5 pl-6 text-sm leading-relaxed text-muted"
                : "mt-4 list-disc space-y-1.5 pl-6 text-sm leading-relaxed text-muted",
            },
            block.items.map((item, j) =>
              React.createElement(
                "li",
                { key: j },
                renderInline(item, `li${i}-${j}`),
              ),
            ),
          );
        default:
          return React.createElement(
            "p",
            {
              key: i,
              className: "mt-4 text-sm leading-relaxed text-muted",
            },
            renderInline(block.children, `p${i}`),
          );
      }
    }),
  );
}
