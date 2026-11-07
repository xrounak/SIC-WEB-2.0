import type { ReactNode } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";

/**
 * Event descriptions and rule books are written in Markdown (headings, lists, tables,
 * links). Raw HTML is never rendered and unsafe link schemes are dropped by
 * react-markdown, so a description can't inject scripts. Single line breaks are kept,
 * so older plain-text descriptions look as they did.
 */

export function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 60);
}

function textOf(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textOf).join("");
  if (node && typeof node === "object" && "props" in node) return textOf((node as { props: { children?: ReactNode } }).props.children);
  return "";
}

const components: Components = {
  h1: ({ children }) => <h2 id={slugify(textOf(children))}>{children}</h2>,
  h2: ({ children }) => <h2 id={slugify(textOf(children))}>{children}</h2>,
  h3: ({ children }) => <h3 id={slugify(textOf(children))}>{children}</h3>,
  a: ({ href, children }) => {
    const external = !!href && /^https?:\/\//.test(href);
    return (
      <a href={href} {...(external ? { target: "_blank", rel: "noopener noreferrer nofollow" } : {})}>
        {children}
      </a>
    );
  },
  table: ({ children }) => (
    <div className="prose-table">
      <table>{children}</table>
    </div>
  ),
  img: ({ src, alt }) => (typeof src === "string" ? <img src={src} alt={alt ?? ""} loading="lazy" /> : null),
};

export function Markdown({ source, className = "prose-sic" }: { source: string; className?: string }) {
  return (
    <div className={className}>
      <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]} components={components} skipHtml>
        {source}
      </ReactMarkdown>
    </div>
  );
}

/** Headings (## and ###) for a small table of contents. */
export function outline(source: string) {
  return source
    .split("\n")
    .map((line) => /^(#{1,3})\s+(.+?)\s*#*\s*$/.exec(line))
    .filter((m): m is RegExpExecArray => !!m)
    .map((m) => ({ depth: m[1].length === 3 ? 3 : 2, text: m[2].replace(/[*_`]/g, ""), id: slugify(m[2].replace(/[*_`]/g, "")) }));
}
