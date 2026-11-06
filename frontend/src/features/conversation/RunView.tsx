/** 一次任务的运行视图：思考、汇报、工具调用、审批、交付，按事件顺序排列。 */
import { BookOpen, Download, GitFork, Play } from 'lucide-react';
import { useMemo } from 'react';
import { api } from '../../api/endpoints';
import { SafeMarkdown } from '../../components/common/SafeMarkdown';
import { HitlApprovalCard } from '../../components/domain/HitlApprovalCard';
import { CopyButton } from '../../components/ui/CopyButton';
import { IconButton } from '../../components/ui/primitives';
import { useAppStore } from '../../stores/useAppStore';
import { useCockpitStore } from '../../stores/useCockpitStore';
import { useUiStore } from '../../stores/useUiStore';
import type { RunState, TimelineItem } from '../../stores/taskReducer';
import { TERMINAL_STATUSES } from '../../types/api';
import { formatDuration } from '../../utils/time';
import { useNow } from '../../utils/useNow';
import { AgentGroup } from './blocks/AgentGroup';
import { ReasoningBlock } from './blocks/ReasoningBlock';
import { SayBlock } from './blocks/SayBlock';
import { ToolCard } from './blocks/ToolCard';

type AgentItem = Extract<TimelineItem, { kind: 'agent' }>;
type Node = { key: string; item: TimelineItem } | { key: string; agents: AgentItem[] };

/** 相邻的同类 agent 事件合并成一组 */
function nodesOf(items: TimelineItem[]): Node[] {
  const out: Node[] = [];
  for (const [index, item] of items.entries()) {
    const key = `${item.seq}-${index}`;
    const prev = out[out.length - 1];
    if (item.kind === 'agent' && prev && 'agents' in prev && prev.agents[0]?.group === item.group) {
      prev.agents.push(item);
    } else if (item.kind === 'agent') {
      out.push({ key, agents: [item] });
    } else {
      out.push({ key, item });
    }
  }
  return out;
}

export function RunView({
  run,
  live,
  onFork,
}: {
  run: RunState;
  /** 当前正在订阅的任务（可审批、可续跑）；回放的历史任务为 false */
  live: boolean;
  onFork?: () => void;
}) {
  const approve = useAppStore((s) => s.approve);
  const reject = useAppStore((s) => s.reject);
  const resume = useAppStore((s) => s.resume);
  const openArtifact = useCockpitStore((s) => s.openArtifact);
  const nodes = useMemo(() => nodesOf(run.items), [run.items]);
  const terminal = TERMINAL_STATUSES.includes(run.status);
  const working = !terminal && run.status !== 'waiting_for_approval';
  const streaming = run.items.some(
    (i) => (i.kind === 'reasoning' || i.kind === 'say') && i.streaming,
  );
  const now = useNow(working && !streaming);

  return (
    <div className="space-y-1">
      {nodes.map((n) => {
        if ('agents' in n) return <AgentGroup key={n.key} items={n.agents} />;
        const item = n.item;
        const turn = 'turn' in item ? item.turn : 'step' in item ? item.step : undefined;
        let content = null;
        switch (item.kind) {
          case 'reasoning':
            content = <ReasoningBlock item={item} />;
            break;
          case 'say':
            content = <SayBlock item={item} />;
            break;
          case 'tool':
            content = <ToolCard item={item} taskId={run.taskId} />;
            break;
          case 'decision':
            content = (
              <div className="relative pl-3 py-0.5 border-l border-line-subtle dark:border-[#27272A] font-mono text-[11.5px]">
                <span className="text-ink-ghost select-none mr-1.5">⎿</span>
                <span className={item.approved ? 'text-ok font-semibold' : 'text-warn font-semibold'}>
                  {item.approved ? '已批准' : `已拒绝：${item.text}`}
                </span>
              </div>
            );
            break;
          case 'guard':
            content = (
              <div className="relative pl-3 py-0.5 border-l border-line-subtle dark:border-[#27272A] font-mono text-[11.5px] text-warn">
                <span className="text-ink-ghost select-none mr-1.5">⎿</span>
                <span>{item.text}</span>
              </div>
            );
            break;
          case 'unknown':
            content = (
              <div className="relative pl-3 py-0.5 border-l border-line-subtle dark:border-[#27272A] font-mono text-[10px] text-ink-ghost">
                <span className="text-ink-ghost select-none mr-1.5">⎿</span>
                <span>{item.name}</span>
              </div>
            );
            break;
          default:
            content = null;
        }
        if (!content) return null;
        return (
          <div
            key={n.key}
            id={turn ? `turn-item-${turn}` : undefined}
            data-turn={turn}
            className="scroll-mt-6"
          >
            {content}
          </div>
        );
      })}

      {live && run.approval && (
        <HitlApprovalCard
          request={run.approval}
          onApprove={(decision) => approve(decision)}
          onReject={(reason) => reject(reason)}
        />
      )}

      {working && !streaming && (
        <div className="flex items-center gap-2 text-[12.5px] text-mute" role="status">
          <span className="flex gap-0.5" aria-hidden>
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="h-1 w-1 animate-dots rounded-full bg-accent"
                style={{ animationDelay: `${i * 0.18}s` }}
              />
            ))}
          </span>
          {run.startedTs && (
            <span className="tabular-nums">
              {formatDuration(Math.max(0, (now - run.startedTs) * 1000))}
            </span>
          )}
        </div>
      )}

      {run.error && <p className="text-[13px] text-bad">{run.error}</p>}

      {terminal && run.delivery && (
        <div className="py-2 space-y-2">
          <div className="flex items-center justify-between border-b border-[#2B2A27]/10 pb-1.5 dark:border-white/10">
            <span className="font-mono text-[11px] font-semibold text-ink dark:text-zinc-200">
              [ SRE 任务交付与巡检大盘 ]
            </span>
            <button
              onClick={() => {
                openArtifact('系统全要素巡检与调优诊断大盘.md', run.delivery || '');
                useUiStore.getState().setInspectorOpen(true);
              }}
              className="inline-flex items-center gap-1.5 rounded border border-[#2B2A27]/20 bg-canvas px-2.5 py-1 font-mono text-[11px] font-medium text-ink transition hover:border-[#2B2A27] hover:bg-ink/[0.04] active:scale-95 dark:border-white/20 dark:text-zinc-200 dark:hover:border-white"
            >
              <BookOpen size={12} />
              <span>展开 480px 产物抽屉 (TOC / SOP)</span>
            </button>
          </div>
          <SafeMarkdown text={run.delivery} />
        </div>
      )}

      {terminal && (
        <div className="flex items-center gap-1 border-t border-ink/[0.06] pt-2 text-[12px] text-mute dark:border-white/[0.06]">
          <span className="tabular-nums">
            {run.stepCount} 回合 · {run.totalTokens.toLocaleString()} Token
            {run.startedTs && run.finishedTs
              ? ` · ${formatDuration((run.finishedTs - run.startedTs) * 1000)}`
              : ''}
          </span>
          {run.terminationReason && run.status !== 'succeeded' && (
            <span className="ml-2 min-w-0 truncate text-bad">{run.terminationReason}</span>
          )}
          <span className="ml-auto flex items-center">
            {run.delivery && <CopyButton text={run.delivery} label="复制交付" />}
            <IconButton
              label="下载轨迹"
              className="h-6 w-6"
              onClick={() => window.open(api.tasks.traceUrl(run.taskId))}
            >
              <Download size={13} />
            </IconButton>
            {onFork && (
              <IconButton label="从这里分支" className="h-6 w-6" onClick={onFork}>
                <GitFork size={13} />
              </IconButton>
            )}
            {live && run.status !== 'succeeded' && (
              <IconButton label="从检查点续跑" className="h-6 w-6" onClick={() => void resume()}>
                <Play size={13} />
              </IconButton>
            )}
          </span>
        </div>
      )}
    </div>
  );
}
