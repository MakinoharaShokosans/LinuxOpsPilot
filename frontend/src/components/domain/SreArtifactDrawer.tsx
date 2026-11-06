import { AnimatePresence, motion } from 'motion/react';
import {
  Bookmark,
  Check,
  FileText,
  PanelLeftClose,
  PanelLeftOpen,
  Printer,
  Sparkles,
  X,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { useCockpitStore } from '../../stores/useCockpitStore';
import { SafeMarkdown } from '../common/SafeMarkdown';
import { Tip } from '../ui/Tooltip';
import { cn } from '../../utils/text';

interface HeadingItem {
  id: string;
  text: string;
  level: number;
}

function parseHeadings(markdown: string): HeadingItem[] {
  const lines = markdown.split('\n');
  const headings: HeadingItem[] = [];
  let count = 0;
  for (const line of lines) {
    const match = /^(#{1,3})\s+(.+)$/.exec(line);
    if (match) {
      count++;
      const level = match[1]?.length ?? 1;
      const text = match[2]?.trim() ?? '';
      headings.push({
        id: `heading-${count}-${text.slice(0, 10).replace(/\s+/g, '-')}`,
        text,
        level,
      });
    }
  }
  return headings;
}

/**
 * 交付产物阅读内容区（供独立抽屉与统一检视器复用）
 */
export function SreArtifactContent({
  onClose,
  isEmbedded = false,
}: {
  onClose?: () => void;
  isEmbedded?: boolean;
}) {
  const { activeArtifact, closeArtifact, tocCollapsed, toggleToc } = useCockpitStore();
  const { title, content, path, timestamp } = activeArtifact;

  const [copiedPlaybook, setCopiedPlaybook] = useState(false);
  const [activeHeading, setActiveHeading] = useState<string>('');

  const headings = useMemo(() => parseHeadings(content), [content]);
  const handleClose = onClose || closeArtifact;

  // 从 Markdown 报告中提取 Bash 命令并生成可执行的 Playbook SOP
  const extractPlaybook = () => {
    const bashBlocks: string[] = [];
    const regex = /```(?:bash|sh)\n([\s\S]*?)```/g;
    let match;
    while ((match = regex.exec(content)) !== null) {
      if (match[1]) bashBlocks.push(match[1].trim());
    }

    const script = `#!/usr/bin/env bash
# ==============================================================================
# SRE 自动化自愈 Playbook - 自动固化自: ${title}
# 生成时间: ${new Date().toISOString()}
# 目标节点: 127.0.0.1 (AUDIT-ID: SEC-ENFORCED)
# ==============================================================================
set -euo pipefail

echo ">>> 开始执行 SRE 诊断建议修复步骤..."

${
  bashBlocks.length > 0
    ? bashBlocks.map((b, idx) => `# 步骤 ${idx + 1}\necho ">>> 执行: 步骤 ${idx + 1}"\n${b}`).join('\n\n')
    : '# 未在报告中检索到可执行命令，已生成基线预检命令\nulimit -f unlimited\ncat /proc/pressure/io'
}

echo ">>> SRE 自愈 Playbook 执行完毕，请复查系统遥测状态。"
`;
    void navigator.clipboard?.writeText(script);
    setCopiedPlaybook(true);
    setTimeout(() => setCopiedPlaybook(false), 1400);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-canvas text-ink dark:bg-[#18181B] dark:text-zinc-100">
      {/* 独立抽屉顶栏（仅非内嵌时展示，内嵌检视器时由 Inspector 统一接管顶栏与关闭） */}
      {!isEmbedded && (
        <div className="flex h-11 shrink-0 items-center justify-between border-b border-[#2B2A27]/10 px-4 font-mono text-[11px] text-mute dark:border-white/10">
          <div className="flex min-w-0 items-center gap-2">
            <FileText size={14} className="shrink-0 text-ink dark:text-white" />
            <span className="truncate font-semibold text-ink dark:text-white">{title}</span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <Tip label="关闭抽屉 (Esc)">
              <button
                onClick={handleClose}
                aria-label="关闭抽屉"
                className="flex h-7 w-7 items-center justify-center rounded border border-transparent transition-colors hover:border-[#2B2A27]/20 hover:bg-ink/[0.04] active:scale-95 dark:hover:border-white/20 dark:hover:bg-white/10"
              >
                <X size={14} />
              </button>
            </Tip>
          </div>
        </div>
      )}

      {/* 路径、标题与大纲控制副标题 */}
      <div className="flex items-center justify-between border-b border-[#2B2A27]/08 bg-subtle px-4 py-2 font-mono text-[11px] text-mute dark:border-white/08 dark:bg-white/[0.02]">
        <div className="flex min-w-0 items-center gap-2">
          {isEmbedded && (
            <>
              <FileText size={13} className="shrink-0 text-ink dark:text-white" />
              <span className="truncate font-semibold text-ink dark:text-zinc-100">{title}</span>
              <span className="hidden md:inline text-mute/40">·</span>
            </>
          )}
          <span className="truncate text-[10px] text-mute">
            PATH: {path || '/var/log/linuxops/reports/latest.md'}
          </span>
        </div>

        <div className="flex shrink-0 items-center gap-2.5">
          <span className="hidden sm:inline text-[10px] text-mute">{timestamp || 'JUST NOW'}</span>

          {headings.length > 0 && (
            <Tip label={tocCollapsed ? '展开大纲索引 (宽屏模式)' : '收起大纲索引 (全幅正文)'}>
              <button
                onClick={toggleToc}
                aria-label={tocCollapsed ? '展开大纲' : '收起大纲'}
                className="inline-flex h-6 items-center gap-1 rounded border border-[#2B2A27]/15 bg-canvas px-2 text-[10px] font-medium text-ink transition hover:border-[#2B2A27] dark:border-white/15 dark:bg-[#202024] dark:text-zinc-200 dark:hover:border-white"
              >
                {tocCollapsed ? <PanelLeftOpen size={11} /> : <PanelLeftClose size={11} />}
                <span>{tocCollapsed ? '展开大纲' : '收起大纲'}</span>
              </button>
            </Tip>
          )}
        </div>
      </div>

      {/* 抽屉内容区：左侧可折叠 TOC + 右侧宽幅 Markdown 正文 */}
      <div className="flex min-h-0 flex-1 overflow-hidden">
        {/* 左侧 1px 垂直刻度引线大纲 (TOC) - 展开状态 */}
        {!tocCollapsed && headings.length > 0 && (
          <div className="hidden sm:block w-48 shrink-0 overflow-y-auto border-r border-[#2B2A27]/10 p-3.5 font-mono text-[10.5px] dark:border-white/10">
            <div className="mb-2.5 flex items-center justify-between font-semibold text-ink dark:text-zinc-200">
              <div className="flex items-center gap-1.5">
                <Bookmark size={11} />
                <span>大纲索引</span>
              </div>
              <Tip label="收起大纲">
                <button
                  onClick={toggleToc}
                  aria-label="收起大纲索引"
                  className="rounded p-0.5 text-mute hover:bg-ink/[0.04] hover:text-ink dark:hover:bg-white/10 dark:hover:text-white"
                >
                  <PanelLeftClose size={11} />
                </button>
              </Tip>
            </div>
            <nav className="relative space-y-1.5 border-l border-[#2B2A27]/20 pl-2 dark:border-white/20">
              {headings.map((h) => (
                <button
                  key={h.id}
                  onClick={() => {
                    setActiveHeading(h.id);
                    const el = document.getElementById(h.id);
                    el?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className={`group block w-full truncate text-left transition-colors ${
                    activeHeading === h.id
                      ? 'font-bold text-ink dark:text-white'
                      : 'text-mute hover:text-ink dark:hover:text-zinc-200'
                  } ${h.level === 2 ? 'pl-2' : ''}`}
                >
                  <span className="truncate">{h.text}</span>
                </button>
              ))}
            </nav>
          </div>
        )}

        {/* 当 TOC 折叠时的极简垂直边条 */}
        {tocCollapsed && headings.length > 0 && (
          <div className="hidden sm:flex w-8 shrink-0 flex-col items-center border-r border-[#2B2A27]/10 bg-subtle/30 py-3 dark:border-white/10">
            <Tip label="展开大纲索引">
              <button
                onClick={toggleToc}
                aria-label="展开大纲索引"
                className="flex flex-col items-center gap-1.5 rounded p-1 text-mute transition-colors hover:bg-ink/[0.06] hover:text-ink dark:hover:bg-white/10 dark:hover:text-white"
              >
                <PanelLeftOpen size={13} />
                <span className="[writing-mode:vertical-rl] text-[9.5px] font-mono tracking-widest text-mute">
                  大纲
                </span>
              </button>
            </Tip>
          </div>
        )}

        {/* 正文阅读区：由 250px 扩展为最高 768px 黄金视觉行长 */}
        <div className="flex-1 overflow-y-auto px-6 py-6 sm:px-10 sm:py-8 font-sans leading-relaxed">
          <div className="mx-auto max-w-3xl">
            <SafeMarkdown text={content} />
          </div>
        </div>
      </div>

      {/* 底部固化与沉淀操作栏 (Runbook 固化) */}
      <div className="flex h-12 shrink-0 items-center justify-between border-t border-[#2B2A27]/10 bg-subtle px-4 font-mono text-[11px] dark:border-white/10 dark:bg-white/[0.02]">
        <Tip label="打印或导出 PDF">
          <button
            onClick={handlePrint}
            aria-label="导出 PDF"
            className="inline-flex h-7 items-center gap-1.5 rounded border border-[#2B2A27]/20 bg-canvas px-2.5 font-medium text-ink transition hover:border-[#2B2A27] hover:bg-ink/[0.04] active:scale-95 dark:border-white/20 dark:text-zinc-200 dark:hover:border-white dark:hover:bg-white/10"
          >
            <Printer size={12} />
            <span>导出 PDF</span>
          </button>
        </Tip>

        {/* 提取自愈 Playbook：纯 SVG 状态流转，零文字抖动 */}
        <Tip
          label={
            copiedPlaybook
              ? 'Playbook 脚本已提取并复制到剪贴板！'
              : '将诊断步骤一键提取为自动化自愈脚本 (.sh)'
          }
        >
          <button
            onClick={extractPlaybook}
            aria-label="提取自愈 Playbook"
            className="inline-flex h-7 items-center gap-1.5 rounded border border-[#2B2A27]/25 bg-canvas px-2.5 font-semibold text-ink shadow-sm transition hover:border-[#2B2A27] hover:bg-ink/[0.04] active:scale-95 dark:border-white/25 dark:text-zinc-100 dark:hover:border-white dark:hover:bg-white/10"
          >
            {copiedPlaybook ? (
              <>
                <Check size={12} className="text-[#437A58]" />
                <span className="text-[#437A58]">已复制 Playbook</span>
              </>
            ) : (
              <>
                <Sparkles size={12} className="text-[#D97706]" />
                <span>提取自愈 Playbook</span>
              </>
            )}
          </button>
        </Tip>
      </div>
    </div>
  );
}

/**
 * SRE 智能作战指挥舱 · 交付产物阅读抽屉 (Artifacts & Runbook Hub)
 * 母题 D：折叠撕边与几何对称展开
 */
export function SreArtifactDrawer() {
  const { activeArtifact, closeArtifact, inspectorWide } = useCockpitStore();
  const { open } = activeArtifact;

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Layer 2 景深暗化与模糊遮罩 */}
          <motion.div
            key="artifact-scrim"
            aria-hidden="true"
            className="fixed inset-0 z-drawer bg-black/10 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            onClick={closeArtifact}
          />

          {/* 纯白工业图纸阅读抽屉：支持 880px / 宽屏 1080px 舒适排版 */}
          <motion.aside
            key="artifact-drawer"
            aria-label="交付产物阅读器"
            className={cn(
              'fixed inset-y-0 right-0 z-modal flex flex-col border-l border-[#2B2A27]/20 bg-canvas text-ink shadow-[0_16px_40px_rgba(43,42,39,0.12)] backdrop-blur-2xl dark:border-white/20 dark:bg-[#18181B] dark:text-zinc-100',
              inspectorWide ? 'w-[min(1080px,98vw)]' : 'w-[min(880px,96vw)]',
            )}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          >
            <SreArtifactContent onClose={closeArtifact} />
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
