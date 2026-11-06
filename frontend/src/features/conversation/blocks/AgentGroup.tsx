/** 联网搜索、子智能体、上下文压缩：折叠成一行摘要，展开看明细；被拦截的事件自动展开。 */
import { Bot, Globe, Layers } from 'lucide-react';
import { useState } from 'react';
import { Chevron, Reveal } from '../../../components/ui/primitives';
import type { AgentGroup as Group, TimelineItem } from '../../../stores/taskReducer';
import { cn } from '../../../utils/text';

type Item = Extract<TimelineItem, { kind: 'agent' }>;

const ICON: Record<Group, typeof Bot> = { websearch: Globe, subagent: Bot, compaction: Layers };

export function AgentGroup({ items }: { items: Item[] }) {
  const warned = items.some((i) => i.tone === 'warn');
  const [open, setOpen] = useState(warned);
  const group = items[0]?.group ?? 'subagent';
  const Icon = ICON[group];
  const last = items[items.length - 1];

  return (
    <div className="relative pl-3 py-0.5 border-l border-line-subtle dark:border-[#27272A] group transition-colors">
      <button
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'group flex w-full items-center gap-1.5 py-0.5 text-left font-mono text-[11.5px] transition-colors',
          warned ? 'text-warn' : 'text-ink-subtle hover:text-ink-heavy',
        )}
      >
        <span className="text-ink-ghost select-none">⎿</span>
        <Icon size={12} className="shrink-0" />
        <span className="min-w-0 flex-1 truncate font-mono text-[11.5px]">
          {last?.text}
        </span>
        {items.length > 1 && (
          <span className="shrink-0 text-[10px] tabular-nums text-ink-ghost">
            ({items.length})
          </span>
        )}
        <Chevron open={open} size={11} className="text-ink-ghost group-hover:text-ink-heavy" />
      </button>
      <Reveal open={open}>
        <ul className="mt-1 mb-2 ml-1 pl-3 py-1.5 border-l border-ink/20 dark:border-white/20 bg-[#FAFAFA]/90 dark:bg-[#121214]/90 space-y-1 font-mono text-[11px]">
          {items.map((i) => (
            <li
              key={i.seq}
              className={cn(
                'break-words leading-snug',
                i.tone === 'warn' ? 'font-medium text-warn' : 'text-ink-body',
              )}
            >
              {i.text}
            </li>
          ))}
        </ul>
      </Reveal>
    </div>
  );
}
