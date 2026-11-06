/** 思考链：流式时展开并滚动跟随，完成后折叠为一行；纯文本，按不可信内容处理。 */
import { Brain } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Chevron, Reveal } from '../../../components/ui/primitives';
import { useUiStore } from '../../../stores/useUiStore';
import type { TimelineItem } from '../../../stores/taskReducer';
import { cn, stripControl } from '../../../utils/text';
import { formatDuration } from '../../../utils/time';
import { useNow } from '../../../utils/useNow';

type Item = Extract<TimelineItem, { kind: 'reasoning' }>;

export function ReasoningBlock({ item }: { item: Item }) {
  const pref = useUiStore((s) => s.thinking);
  const [open, setOpen] = useState(pref === 'expanded');
  const touched = useRef(false);
  const body = useRef<HTMLDivElement>(null);
  const now = useNow(item.streaming);

  // 流式结束后自动收起一次；用户手动操作过就不再干预
  useEffect(() => {
    if (!item.streaming && !touched.current) setOpen(false);
  }, [item.streaming]);

  useEffect(() => {
    if (item.streaming && body.current) body.current.scrollTop = body.current.scrollHeight;
  }, [item.text, item.streaming]);

  if (pref === 'hidden') return null;
  const elapsed = ((item.endTs ?? now) - item.startTs) * 1000;
  // 模型一次回完整思考时没有 delta，起止会相同；这时不显示一个假的 0ms
  const duration = Math.max(0, elapsed);
  const label = item.streaming
    ? `思考中${duration >= 500 ? ` ${formatDuration(duration)}` : ''}`
    : `思考${duration >= 500 ? ` ${formatDuration(duration)}` : ''}`;

  return (
    <div className="relative pl-3 py-0.5 border-l border-line-subtle dark:border-[#27272A] group transition-colors">
      <button
        aria-expanded={open}
        onClick={() => {
          touched.current = true;
          setOpen((v) => !v);
        }}
        className="group flex items-center gap-1.5 py-0.5 font-mono text-[11.5px] text-ink-subtle transition-colors hover:text-ink-heavy"
      >
        <span className="text-ink-ghost select-none">⎿</span>
        <Brain size={12} className={cn('shrink-0', item.streaming && 'animate-breathe text-accent')} />
        <span className="tabular-nums font-mono text-[11.5px]">
          {label}
        </span>
        <Chevron open={open} size={11} className="text-ink-ghost group-hover:text-ink-heavy" />
      </button>
      <Reveal open={open}>
        <div
          ref={body}
          className="mt-1 mb-2 ml-1 pl-3 py-2 border-l border-ink/20 dark:border-white/20 bg-[#FAFAFA]/90 dark:bg-[#121214]/90 max-h-72 overflow-y-auto whitespace-pre-wrap break-words font-mono text-[11px] leading-relaxed text-ink-body"
        >
          {stripControl(item.text)}
          {item.streaming && (
            <span className="ml-0.5 inline-block h-3.5 w-1.5 translate-y-0.5 animate-pulse bg-accent/70" />
          )}
        </div>
      </Reveal>
    </div>
  );
}
