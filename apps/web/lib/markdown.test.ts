import { render, screen } from "@testing-library/react";
import { createElement } from "react";
import { describe, expect, it } from "vitest";
import {
  MarkdownContent,
  escapeHtml,
  isSafeUrl,
  parseMarkdown,
} from "./markdown";

describe("escapeHtml", () => {
  it("escapes HTML-significant characters", () => {
    expect(escapeHtml(`<script>alert("x&y")</script>`)).toBe(
      "&lt;script&gt;alert(&quot;x&amp;y&quot;)&lt;/script&gt;",
    );
    expect(escapeHtml("it's")).toBe("it&#39;s");
  });
});

describe("isSafeUrl", () => {
  it("allows http(s) and relative URLs", () => {
    expect(isSafeUrl("https://example.com/a?b=c")).toBe(true);
    expect(isSafeUrl("http://example.com")).toBe(true);
    expect(isSafeUrl("/paths/intro")).toBe(true);
    expect(isSafeUrl("paths/intro")).toBe(true);
    expect(isSafeUrl("#section")).toBe(true);
  });

  it("rejects dangerous schemes and control characters", () => {
    expect(isSafeUrl("javascript:alert(1)")).toBe(false);
    expect(isSafeUrl("JaVaScRiPt:alert(1)")).toBe(false);
    expect(isSafeUrl("data:text/html,<h1>x</h1>")).toBe(false);
    expect(isSafeUrl("vbscript:msgbox(1)")).toBe(false);
    expect(isSafeUrl("")).toBe(false);
    expect(isSafeUrl("https://example.com/a b")).toBe(false);
  });
});

describe("parseMarkdown", () => {
  it("parses headings, paragraphs, code blocks, lists, and links", () => {
    const blocks = parseMarkdown(
      [
        "# Title",
        "",
        "Hello [world](https://example.com).",
        "",
        "```php",
        "echo 'hi';",
        "```",
        "",
        "- one",
        "- two",
        "",
        "1. first",
        "2. second",
      ].join("\n"),
    );
    expect(blocks[0]).toMatchObject({ type: "heading", level: 1 });
    expect(blocks[1]).toMatchObject({ type: "paragraph" });
    expect(blocks[2]).toMatchObject({
      type: "code",
      language: "php",
      code: "echo 'hi';",
    });
    expect(blocks[3]).toMatchObject({ type: "list", ordered: false });
    expect(blocks[4]).toMatchObject({ type: "list", ordered: true });
    expect((blocks[3] as { items: unknown[] }).items).toHaveLength(2);
  });

  it("demotes unsafe links to plain text", () => {
    const blocks = parseMarkdown("[click](javascript:alert(1))");
    expect(blocks).toHaveLength(1);
    const paragraph = blocks[0];
    if (paragraph.type !== "paragraph") throw new Error("expected paragraph");
    expect(paragraph.children).toEqual([
      { type: "link", text: "click", href: null },
    ]);
  });

  it("renders unclosed fences as code instead of dropping content", () => {
    const blocks = parseMarkdown("```\nsecret stuff");
    expect(blocks).toHaveLength(1);
    expect(blocks[0]).toMatchObject({ type: "code", code: "secret stuff" });
  });
});

describe("MarkdownContent", () => {
  it("renders headings and code blocks", () => {
    render(
      createElement(MarkdownContent, {
        content: "## Getting started\n\n```bash\necho hi\n```",
      }),
    );
    expect(
      screen.getByRole("heading", { name: "Getting started", level: 2 }),
    ).toBeInTheDocument();
    expect(screen.getByText("echo hi")).toBeInTheDocument();
  });

  it("renders raw HTML as literal text (XSS escaping)", () => {
    const { container } = render(
      createElement(MarkdownContent, {
        content:
          '<script>alert("pwned")</script>\n\n<img src=x onerror=alert(1)>',
      }),
    );
    expect(container.querySelector("script")).toBeNull();
    expect(container.querySelector("img")).toBeNull();
    expect(screen.getByText(/alert\("pwned"\)/)).toBeInTheDocument();
  });

  it("renders safe links and strips dangerous ones", () => {
    render(
      createElement(MarkdownContent, {
        content: "[docs](https://example.com) and [evil](javascript:alert(1))",
      }),
    );
    const docs = screen.getByRole("link", { name: "docs" });
    expect(docs).toHaveAttribute("href", "https://example.com");
    expect(
      screen.queryByRole("link", { name: "evil" }),
    ).not.toBeInTheDocument();
    expect(screen.getByText(/evil/)).toBeInTheDocument();
  });

  it("renders lists", () => {
    render(createElement(MarkdownContent, { content: "- alpha\n- beta" }));
    expect(screen.getByRole("list")).toBeInTheDocument();
    expect(screen.getByText("alpha")).toBeInTheDocument();
    expect(screen.getByText("beta")).toBeInTheDocument();
  });

  it("renders nothing for blank input", () => {
    const { container } = render(
      createElement(MarkdownContent, { content: "   \n\n  " }),
    );
    expect(container).toBeEmptyDOMElement();
  });
});
