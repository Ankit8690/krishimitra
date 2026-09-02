"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/**
 * Renders assistant chat replies as GitHub-flavored markdown.
 * Styled for mobile-first, tight vertical rhythm, with horizontal-scroll
 * tables so wide comparisons never break the layout.
 */
export function ChatMarkdown({ children }: { children: string }) {
  return (
    <div className="chat-md text-sm leading-relaxed">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
          h1: ({ children }) => (
            <h1 className="text-base font-bold mt-3 mb-1.5 first:mt-0">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-sm font-bold mt-3 mb-1.5 first:mt-0">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-sm font-semibold mt-2 mb-1 first:mt-0">
              {children}
            </h3>
          ),
          ul: ({ children }) => (
            <ul className="list-disc pl-5 mb-2 space-y-1">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal pl-5 mb-2 space-y-1">{children}</ol>
          ),
          li: ({ children }) => <li className="leading-snug">{children}</li>,
          strong: ({ children }) => (
            <strong className="font-semibold text-brand-ink">{children}</strong>
          ),
          em: ({ children }) => <em className="italic">{children}</em>,
          code: ({ children }) => (
            <code className="bg-brand-line/60 px-1 py-0.5 rounded text-[0.85em] font-mono">
              {children}
            </code>
          ),
          pre: ({ children }) => (
            <pre className="bg-brand-line/40 rounded-lg p-2 overflow-x-auto text-xs mb-2">
              {children}
            </pre>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-brand-primary/50 pl-3 italic text-brand-mute my-2">
              {children}
            </blockquote>
          ),
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-primary underline break-all"
            >
              {children}
            </a>
          ),
          hr: () => <hr className="my-3 border-brand-line" />,
          table: ({ children }) => (
            <div className="my-2 -mx-1 overflow-x-auto">
              <table className="w-full text-xs border-collapse min-w-[16rem]">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-brand-bg">{children}</thead>
          ),
          tbody: ({ children }) => (
            <tbody className="divide-y divide-brand-line">{children}</tbody>
          ),
          tr: ({ children }) => <tr className="align-top">{children}</tr>,
          th: ({ children }) => (
            <th className="text-left font-semibold px-2 py-1.5 border-b border-brand-line whitespace-nowrap">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-2 py-1.5 align-top">{children}</td>
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
