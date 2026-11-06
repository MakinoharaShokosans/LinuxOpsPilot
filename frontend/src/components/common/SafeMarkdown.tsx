/**
 * 渲染来自 Agent 的文本：一律视为不可信。
 * 高反差 SRE 工业图纸排版：1px 细线状态 Tag、合规取证隔离 Callout、代码参数精密排版、无文字抖动复制按钮。
 */
import { Check, Copy, Lock, ShieldCheck } from 'lucide-react';
import { isValidElement, useRef, useState, type ReactNode } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import remarkGfm from 'remark-gfm';
import { Tip } from '../ui/Tooltip';
import { SreEntityPeek, SRE_ENTITIES } from '../domain/SreEntityPeekCard';
import { cn, safeHref, stripControl } from '../../utils/text';

function getTextContent(node: ReactNode): string {
  if (typeof node === 'string') return node;
  if (typeof node === 'number') return String(node);
  if (!node) return '';
  if (Array.isArray(node)) return node.map(getTextContent).join('');
  if (isValidElement<{ children?: ReactNode }>(node)) {
    return getTextContent(node.props.children);
  }
  return '';
}

/** 识别并格式化 SRE 状态 Tag、推理标签、系统路径与 5 类高密度实体透视卡 */
function formatSreTokens(text: string): ReactNode {
  const COMBINED_REGEX =
    /(\[(?:已定性\s*·\s*良性|良性\s*·\s*已定性|指标纠偏\s*·\s*属误读|属误读\s*·\s*指标纠偏|P2\s*待处置|待处置\s*·\s*P2|高危拦截\s*·\s*故障|P1\s*故障)\]|SIGXFSZ|\/usr\/bin\/head|IO\s+pressure\s+86%|IO\s+pressure|taint=12288|docker-forwarding|【现状】|【下一步】|现状[：:]|下一步[：:]|当前诊断[：:]|核心推演[：:]|(?:\/(?:proc|sys|etc|dev)\/[a-zA-Z0-9_\-./]+))/g;

  const parts = text.split(COMBINED_REGEX);
  if (parts.length === 1) return text;

  return parts.map((part, index) => {
    if (!part) return null;
    if (part.startsWith('[') && part.endsWith(']')) {
      if (part.includes('良性')) {
        return (
          <span key={index} className="sre-tag sre-tag-ok">
            <ShieldCheck size={11} className="shrink-0" />
            {part}
          </span>
        );
      }
      if (part.includes('误读')) {
        return (
          <span key={index} className="sre-tag sre-tag-neutral">
            {part}
          </span>
        );
      }
      if (part.includes('P2') || part.includes('待处置')) {
        return (
          <span key={index} className="sre-tag sre-tag-warn">
            {part}
          </span>
        );
      }
      if (part.includes('故障') || part.includes('高危拦截') || part.includes('P1')) {
        return (
          <span key={index} className="sre-tag sre-tag-danger">
            {part}
          </span>
        );
      }
    }

    // Agent 推理核心标签高反差墨阶强化 (Level 1: #1A1A1A + 13.5px font-semibold)
    if (
      part === '【现状】' ||
      part === '【下一步】' ||
      part.startsWith('现状') ||
      part.startsWith('下一步') ||
      part.startsWith('当前诊断') ||
      part.startsWith('核心推演')
    ) {
      return (
        <span
          key={index}
          className="font-semibold text-[13.5px] text-ink-heavy dark:text-[#F5F5F7] tracking-tight inline-flex items-center mr-1 select-none"
        >
          {part}
        </span>
      );
    }

    const normalizedKey = part.replace(/\s+/g, ' ').trim();
    if (SRE_ENTITIES[normalizedKey] || SRE_ENTITIES[part]) {
      const key = SRE_ENTITIES[normalizedKey] ? normalizedKey : part;
      return (
        <SreEntityPeek key={index} entityKey={key}>
          {part}
        </SreEntityPeek>
      );
    }

    // Linux 关键系统路径 (1px 微边框代码微标包裹)
    if (/^\/(?:proc|sys|etc|dev)\//.test(part)) {
      return (
        <code
          key={index}
          className="font-mono text-[11.5px] bg-ink/[0.04] dark:bg-white/[0.06] px-1.5 py-0.5 rounded-[3px] border border-ink/[0.08] dark:border-white/[0.08] font-medium text-ink dark:text-zinc-200"
        >
          {part}
        </code>
      );
    }

    return part;
  });
}

function renderSreNodes(nodes: ReactNode): ReactNode {
  if (typeof nodes === 'string') {
    return formatSreTokens(nodes);
  }
  if (Array.isArray(nodes)) {
    return nodes.map((node, i) => <span key={i}>{renderSreNodes(node)}</span>);
  }
  return nodes;
}

/** 代码块：固定尺寸纯 SVG 图标流转，零文字拉伸抖动 */
function CodeBlock({ children }: { children?: ReactNode }) {
  const ref = useRef<HTMLPreElement>(null);
  const [copied, setCopied] = useState(false);
  const className =
    isValidElement<{ className?: string }>(children) && typeof children.props.className === 'string'
      ? children.props.className
      : '';
  const language = /language-([\w+#-]+)/.exec(className)?.[1] ?? '';
  return (
    <div className="not-prose my-3 overflow-hidden rounded-xl border border-ink/[0.08] bg-code text-code-ink dark:border-white/[0.08]">
      <div className="flex h-8 items-center border-b border-ink/[0.05] px-3.5 text-2xs text-code-ink/60 dark:border-white/[0.05]">
        <span className="font-mono text-[11px] text-mute">{language || 'text'}</span>
        <div className="ml-auto flex items-center">
          <Tip label={copied ? '已复制' : '复制代码'}>
            <button
              className="flex h-6 w-6 items-center justify-center rounded transition-colors hover:bg-ink/[0.06] hover:text-code-ink active:scale-95 dark:hover:bg-white/10"
              aria-label="复制代码"
              onClick={() => {
                void navigator.clipboard?.writeText(ref.current?.textContent ?? '');
                setCopied(true);
                setTimeout(() => setCopied(false), 1400);
              }}
            >
              {copied ? <Check size={13} className="text-ok" /> : <Copy size={13} />}
            </button>
          </Tip>
        </div>
      </div>
      <pre ref={ref} className="p-3.5 font-mono text-[12px] leading-relaxed">
        {children}
      </pre>
    </div>
  );
}

export function SafeMarkdown({ text }: { text: string }) {
  return (
    <div className="prose-agent">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[[rehypeHighlight, { detect: false }]]}
        skipHtml
        urlTransform={(url) => safeHref(url) ?? ''}
        components={{
          a: ({ href, children }) => {
            const safe = safeHref(href);
            return safe ? (
              <a
                href={safe}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-ink underline decoration-ink/30 underline-offset-[3px] hover:decoration-ink dark:text-white dark:decoration-white/30 dark:hover:decoration-white"
              >
                {children}
              </a>
            ) : (
              <span>{children}</span>
            );
          },
          p: ({ children }) => <p>{renderSreNodes(children)}</p>,
          li: ({ children }) => <li>{renderSreNodes(children)}</li>,
          code: ({
            inline,
            className,
            children,
            ...props
          }: {
            inline?: boolean;
            className?: string;
            children?: ReactNode;
          }) => {
            const isBlock = !inline && className;
            if (isBlock) {
              return (
                <code className={className} {...props}>
                  {children}
                </code>
              );
            }
            const raw = getTextContent(children).trim();
            const normalized = raw.replace(/\s+/g, ' ');
            const entityKey = SRE_ENTITIES[normalized] ? normalized : SRE_ENTITIES[raw] ? raw : null;
            if (entityKey) {
              return (
                <SreEntityPeek entityKey={entityKey}>
                  <code
                    className="font-mono text-[11.5px] bg-ink/[0.04] dark:bg-white/[0.06] px-1.5 py-0.5 rounded border border-ink/[0.08] dark:border-white/[0.08] font-medium text-ink dark:text-zinc-200"
                    {...props}
                  >
                    {children}
                  </code>
                </SreEntityPeek>
              );
            }
            return (
              <code
                className="font-mono text-[11.5px] bg-ink/[0.04] dark:bg-white/[0.06] px-1.5 py-0.5 rounded border border-ink/[0.08] dark:border-white/[0.08] font-medium text-ink dark:text-zinc-200"
                {...props}
              >
                {children}
              </code>
            );
          },
          h2: ({ children }) => {
            const text = getTextContent(children);
            const isRootCause = text.includes('根因') || text.includes('诊断') || text.includes('结论');
            const isAction = text.includes('处置') || text.includes('建议') || text.includes('修复');
            return (
              <div className="mt-4 mb-2 flex items-center gap-2 border-b border-ink/[0.08] pb-1.5 font-sans text-[13.5px] font-semibold text-ink dark:border-white/[0.08] dark:text-zinc-100">
                <span
                  className={cn(
                    'h-2 w-2 rounded-sm',
                    isRootCause ? 'bg-ok' : isAction ? 'bg-warn' : 'bg-ink/40 dark:bg-white/40',
                  )}
                />
                <span className="flex-1">{children}</span>
                <span className="font-mono text-[9px] text-mute uppercase tracking-widest">
                  DIAGNOSTIC-REF
                </span>
              </div>
            );
          },
          h3: ({ children }) => (
            <div className="mt-3 mb-1.5 flex items-center gap-1.5 font-sans text-[12.5px] font-semibold text-ink dark:text-zinc-200">
              <span className="h-1.5 w-1.5 rounded-full bg-ink/30 dark:bg-white/30" />
              <span>{children}</span>
            </div>
          ),
          table: ({ children }) => (
            <div className="my-3 overflow-x-auto rounded-lg border border-ink/[0.08] dark:border-white/[0.08]">
              <table className="w-full text-left font-mono text-[11.5px]">{children}</table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border-b border-ink/[0.08] bg-ink/[0.03] px-3 py-2 font-semibold text-ink dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-zinc-200">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border-b border-ink/[0.04] px-3 py-1.5 text-ink/80 dark:border-white/[0.04] dark:text-zinc-300">
              {children}
            </td>
          ),
          blockquote: ({ children }) => {
            const content = getTextContent(children);
            const isRestricted =
              content.includes('未提权') ||
              content.includes('取证受限') ||
              content.includes('只读取证') ||
              content.includes('免责声明');

            if (isRestricted) {
              return (
                <div className="sre-callout-restricted">
                  <div className="mb-1.5 flex items-center gap-1.5 font-mono text-[11px] font-semibold text-accent-2">
                    <Lock size={12} className="shrink-0" />
                    <span>只读取证合规审计隔离</span>
                  </div>
                  <div className="text-[13px] text-ink/80 dark:text-zinc-300">{children}</div>
                  <div className="mt-2 flex items-center justify-end gap-1 font-mono text-[9px] text-mute">
                    <span>AUDIT-ID: SEC-ENFORCED · READONLY</span>
                  </div>
                </div>
              );
            }
            return <blockquote>{children}</blockquote>;
          },
          pre: ({ children }) => <CodeBlock>{children}</CodeBlock>,
          img: ({ alt }) => <span className="text-mute">[图片已拦截{alt ? `：${alt}` : ''}]</span>,
        }}
      >
        {stripControl(text)}
      </ReactMarkdown>
    </div>
  );
}
