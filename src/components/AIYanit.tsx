import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";

interface AIYanitProps {
  metin: string;
}

// @tailwindcss/typography kurulu değil, bu yüzden react-markdown'ın
// "components" prop'uyla her elementi mevcut koyu temaya göre elle
// stilliyoruz.
const BILESENLER: Components = {
  h1: ({ children }) => (
    <h1 className="mb-2 mt-4 text-lg font-bold text-foreground first:mt-0">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="mb-2 mt-4 text-base font-bold text-foreground first:mt-0">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="mb-1.5 mt-3 text-sm font-bold text-foreground first:mt-0">
      {children}
    </h3>
  ),
  p: ({ children }) => (
    <p className="mb-3 leading-relaxed text-foreground last:mb-0">{children}</p>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold text-foreground">{children}</strong>
  ),
  em: ({ children }) => <em className="italic">{children}</em>,
  ul: ({ children }) => (
    <ul className="mb-3 list-disc space-y-1 pl-5 text-foreground last:mb-0">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="mb-3 list-decimal space-y-1 pl-5 text-foreground last:mb-0">
      {children}
    </ol>
  ),
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  a: ({ children, href }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-accent underline underline-offset-2 hover:opacity-80"
    >
      {children}
    </a>
  ),
  code: ({ children }) => (
    <code className="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-[0.85em] text-accent-2">
      {children}
    </code>
  ),
  pre: ({ children }) => (
    <pre className="mb-3 overflow-x-auto rounded-lg bg-surface-2 p-3 text-xs text-foreground last:mb-0">
      {children}
    </pre>
  ),
  hr: () => <hr className="my-4 border-border-subtle" />,
  blockquote: ({ children }) => (
    <blockquote className="mb-3 border-l-2 border-accent/40 pl-3 text-foreground-muted last:mb-0">
      {children}
    </blockquote>
  ),
  table: ({ children }) => (
    <div className="mb-3 overflow-x-auto last:mb-0">
      <table className="w-full border-collapse rounded-lg border border-border-subtle text-left text-sm">
        {children}
      </table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-surface-2">{children}</thead>,
  tbody: ({ children }) => <tbody>{children}</tbody>,
  tr: ({ children }) => (
    <tr className="border-b border-border-subtle last:border-0">{children}</tr>
  ),
  th: ({ children }) => (
    <th className="px-3 py-2 text-xs font-semibold text-foreground-muted">
      {children}
    </th>
  ),
  td: ({ children }) => <td className="px-3 py-2 text-foreground">{children}</td>,
};

/**
 * AI cevaplarını (Markdown: başlıklar, **kalın**, tablolar vb.) mevcut
 * koyu temaya uygun şekilde render eden genel amaçlı bileşen. AI Sorgu,
 * Yönetici Raporu ve Girişim Karşılaştırma ekranlarında ortak kullanılır.
 */
export function AIYanit({ metin }: AIYanitProps) {
  return (
    <div className="text-sm">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={BILESENLER}>
        {metin}
      </ReactMarkdown>
    </div>
  );
}
