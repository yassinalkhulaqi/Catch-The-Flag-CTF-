import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

/** Renders Markdown without raw HTML (no rehype-raw). */
export function Markdown({
  content,
  className,
}: {
  content: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "prose-ctf space-y-3 text-sm leading-relaxed text-foreground sm:text-base",
        className,
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ href, children }) => (
            <a
              href={href}
              className="text-accent underline-offset-2 hover:underline"
              rel="noopener noreferrer"
            >
              {children}
            </a>
          ),
          code: ({ children, className: codeClass }) => {
            const inline = !codeClass;
            if (inline) {
              return (
                <code className="rounded bg-surface-raised px-1 py-0.5 font-mono text-[0.9em] text-accent">
                  {children}
                </code>
              );
            }
            return (
              <code className={cn("font-mono text-[0.85em]", codeClass)}>{children}</code>
            );
          },
          pre: ({ children }) => (
            <pre className="overflow-x-auto rounded-md border border-border bg-surface-raised p-4 text-sm">
              {children}
            </pre>
          ),
          ul: ({ children }) => <ul className="list-disc space-y-1 pl-5">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal space-y-1 pl-5">{children}</ol>,
          h1: ({ children }) => (
            <h2 className="font-display text-2xl font-semibold">{children}</h2>
          ),
          h2: ({ children }) => (
            <h3 className="font-display text-xl font-semibold">{children}</h3>
          ),
          h3: ({ children }) => (
            <h4 className="text-lg font-semibold">{children}</h4>
          ),
          p: ({ children }) => <p className="text-muted">{children}</p>,
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-accent/50 pl-4 text-muted">
              {children}
            </blockquote>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">{children}</table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border-b border-border px-2 py-1 text-left font-mono text-xs uppercase text-muted">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border-b border-border/60 px-2 py-1">{children}</td>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
