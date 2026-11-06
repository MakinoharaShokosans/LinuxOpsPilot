/**
 * 通道 A：底层机器执行流（Machine Timeline）
 * 彻底去框化：无边框极简引线流 (Timeline Rail)，严禁框中套框
 * 节点格式：1px 细线分支 ➔ 微型图标 ➔ font-mono text-[12px] 灰色命令 ➔ 耗时微标
 * │ ⎿ [⚡ bash] echo "=== iostat ===" · 464ms · exit 1 ✕
 */
import { useMutation } from '@tanstack/react-query';
import {
  AlertTriangle,
  BookOpen,
  Bot,
  Check,
  FilePen,
  FilePlus,
  FileText,
  FolderTree,
  Globe,
  Loader2,
  Plug,
  Search,
  SquareTerminal,
  Wrench,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { api } from '../../../api/endpoints';
import { CopyButton } from '../../../components/ui/CopyButton';
import { Tip } from '../../../components/ui/Tooltip';
import { Chevron, Reveal } from '../../../components/ui/primitives';
import { SreDiffCard } from '../../../components/domain/SreDiffCard';
import type { TimelineItem } from '../../../stores/taskReducer';
import { cn, stripControl } from '../../../utils/text';
import { clock, formatBytes, formatDuration } from '../../../utils/time';

type Item = Extract<TimelineItem, { kind: 'tool' }>;

const ICONS: Record<string, typeof Wrench> = {
  bash: SquareTerminal,
  view_file: FileText,
  write_file: FilePlus,
  edit_file: FilePen,
  list_dir: FolderTree,
  grep: Search,
  load_skill: BookOpen,
  websearch: Globe,
  delegate: Bot,
  read_artifact: FileText,
};

function str(v: unknown): string {
  return typeof v === 'string' ? v : v == null ? '' : JSON.stringify(v);
}

/** 一行摘要：最能说明“这次调用做了什么”的参数 */
function summaryOf(item: Item): string {
  const a = item.args;
  switch (item.tool) {
    case 'bash':
      return str(a['command']).split('\n')[0] ?? '';
    case 'view_file':
    case 'write_file':
    case 'edit_file':
    case 'list_dir':
      return str(a['path']) || '.';
    case 'grep':
      return `${str(a['pattern'])}${a['path'] ? `  ${str(a['path'])}` : ''}`;
    case 'load_skill':
      return str(a['skill_name']);
    case 'websearch':
      return str(a['topic'] ?? a['query']);
    default: {
      const first = Object.values(a)[0];
      return first === undefined ? '' : str(first);
    }
  }
}

/** 过滤内部信封协议标签与防注入警示语 */
function formatToolText(text: string): string {
  if (!text) return '';
  let out = text.trim();
  out = out.replace(/^<(?:tool_observation|external_content)\b[^>]*>\s*/i, '');
  out = out.replace(/\s*<\/(?:tool_observation|external_content)>\s*$/i, '');
  out = out.replace(/^以上内容来自不可信来源[^\n]*\n+/i, '');
  return out.trim();
}

/** 展开态详情（去框化裸露排版） */
function Detail({ item, taskId }: { item: Item; taskId: string }) {
  const [full, setFull] = useState<string | null>(null);
  const load = useMutation({
    mutationFn: () => api.tasks.artifact(taskId, item.artifactId as string),
    onSuccess: (text) => setFull(text),
  });

  const a = item.args;
  const live = item.state === 'running';
  const raw = full ?? item.result ?? '';
  const text = formatToolText(raw);
  const failed = item.state === 'failed';
  const cut = item.truncated || (!!item.artifactId && full === null);
  const edits = Array.isArray(a['edits']) ? (a['edits'] as Record<string, unknown>[]) : null;

  return (
    <div className="font-mono text-[11px] leading-5 space-y-2 select-text">
      {/* 命令行 (CMD) */}
      {item.tool === 'bash' && (
        <div>
          <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-ink-ghost pb-0.5">
            <span className="font-semibold text-ink-subtle">CMD</span>
            <CopyButton text={str(a['command'])} label="复制命令" />
          </div>
          <div className="text-ink-heavy whitespace-pre-wrap break-all py-0.5">
            {str(a['command'])}
          </div>
        </div>
      )}

      {/* 文件编辑 Diff (母题 B: 游标卡尺矩形画线) */}
      {item.tool === 'edit_file' && (
        <div>
          <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-ink-ghost pb-0.5">
            <span className="font-semibold text-ink-subtle">DIFF: {str(a['path'])}</span>
          </div>
          <div className="space-y-2 pt-1">
            {edits
              ? edits.map((e, i) => (
                  <SreDiffCard
                    key={i}
                    before={str(e['old_string'])}
                    after={str(e['new_string'])}
                    path={i === 0 ? str(a['path']) : undefined}
                  />
                ))
              : a['old_string'] !== undefined && (
                  <SreDiffCard
                    before={str(a['old_string'])}
                    after={str(a['new_string'])}
                    path={str(a['path'])}
                  />
                )}
          </div>
        </div>
      )}

      {/* 文件写入 */}
      {item.tool === 'write_file' && (
        <div>
          <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-ink-ghost pb-0.5">
            <span className="font-semibold text-ink-subtle">WRITE: {str(a['path'])}</span>
            <CopyButton text={str(a['content'])} label="复制内容" />
          </div>
          <div className="text-ink-heavy whitespace-pre-wrap break-all py-0.5 max-h-56 overflow-auto">
            {str(a['content']).split('\n').slice(0, 60).join('\n')}
          </div>
        </div>
      )}

      {/* 非 bash/write/edit 工具参数 */}
      {item.tool !== 'bash' && item.tool !== 'edit_file' && item.tool !== 'write_file' && (
        <div>
          <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-ink-ghost pb-0.5">
            <span className="font-semibold text-ink-subtle">ARGS</span>
            <CopyButton text={() => JSON.stringify(a, null, 2)} label="复制参数" />
          </div>
          <dl className="space-y-0.5">
            {Object.entries(a).map(([k, v]) => (
              <div key={k} className="flex gap-2">
                <dt className="text-ink-ghost shrink-0">{k}:</dt>
                <dd className="text-ink-body break-all">{str(v)}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      {/* 实时/最终输出 (OUTPUT / STDERR) - 严禁外层套框 */}
      {(live ? !!(item.stdout || item.stderr) : !!(text || item.stdout || item.stderr)) && (
        <div className="pt-1">
          <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-ink-ghost pb-0.5">
            <span className={cn('font-semibold', failed ? 'text-bad' : 'text-ink-subtle')}>
              {failed ? 'STDERR' : 'OUTPUT'}
            </span>
            <CopyButton text={text || item.stdout + item.stderr} label="复制输出" />
          </div>
          <pre
            className={cn(
              'font-mono text-[11px] leading-relaxed whitespace-pre-wrap break-all max-h-80 overflow-auto py-0.5 select-text',
              failed ? 'text-bad' : 'text-ink-body',
            )}
          >
            {stripControl(text || item.stdout + item.stderr)}
          </pre>
          {cut && (
            <div className="mt-1 flex items-center gap-1.5 text-[10.5px] text-warn">
              <AlertTriangle size={11} />
              <span>已截断{item.bytes ? ` · 共 ${formatBytes(item.bytes)}` : ''}</span>
              {item.artifactId && (
                <button
                  className="ml-2 underline hover:text-ink font-mono text-[10.5px]"
                  disabled={load.isPending}
                  onClick={() => load.mutate()}
                >
                  {load.isPending && <Loader2 size={10} className="animate-spin inline mr-1" />}
                  加载完整输出
                </button>
              )}
            </div>
          )}
          {load.isError && (
            <p className="mt-1 text-[11px] text-bad">{(load.error as Error).message}</p>
          )}
        </div>
      )}

      {/* 影响的文件列表 */}
      {item.changedFiles && item.changedFiles.length > 0 && (
        <div className="pt-1">
          <div className="text-[10px] uppercase tracking-wider text-ink-ghost pb-0.5">CHANGED_FILES</div>
          <ul className="space-y-0.5">
            {item.changedFiles.map((f) => (
              <li key={f.path} className="flex gap-2 text-ink-body">
                <span className="min-w-0 flex-1 truncate">{f.path}</span>
                {f.added !== undefined && <span className="text-ok font-semibold">+{f.added}</span>}
                {f.removed !== undefined && <span className="text-bad font-semibold">-{f.removed}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 底部微标信息 */}
      <div className="mt-2 pt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[10px] text-ink-ghost border-t border-line-subtle dark:border-white/[0.06]">
        <span>第 {item.step} 回合</span>
        <span className="tabular-nums">开始 {clock(item.startTs)}</span>
        {item.durationMs !== undefined && (
          <span className="tabular-nums">耗时 {formatDuration(item.durationMs)}</span>
        )}
        {item.exitCode !== undefined && (
          <span className={cn('tabular-nums font-semibold', item.exitCode !== 0 ? 'text-bad' : 'text-ok')}>
            exit {item.exitCode}
          </span>
        )}
        {item.timedOut && <span className="text-bad font-semibold">超时</span>}
        {item.folded && <span>已折叠</span>}
        {item.callId && <span className="text-ink-ghost/60">{item.callId}</span>}
      </div>
    </div>
  );
}

/**
 * 通道 A：底层机器执行流卡片 (去框化无边框极简引线流)
 */
export function ToolCard({ item, taskId }: { item: Item; taskId: string }) {
  const running = item.state === 'running';
  const [open, setOpen] = useState(false);
  const Icon = item.tool.startsWith('mcp__') ? Plug : (ICONS[item.tool] ?? Wrench);
  const duration = item.durationMs ?? (item.endTs ? (item.endTs - item.startTs) * 1000 : undefined);
  const expanded = open || (running && item.tool === 'bash' && !!(item.stdout || item.stderr));
  const summary = summaryOf(item);
  const mcpName = item.tool.startsWith('mcp__')
    ? item.tool.split('__').slice(1).join(' · ')
    : item.tool;

  return (
    <div className="relative pl-3 py-0.5 border-l border-line-subtle dark:border-[#27272A] group transition-colors">
      {/* 节点收起态：1px 细线分支 ➔ 图标 ➔ 等宽灰色命令 ➔ 耗时微标 */}
      <button
        aria-expanded={expanded}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-1.5 text-left font-mono text-[11.5px] text-ink-subtle hover:text-ink-heavy transition-colors py-0.5 group/btn"
      >
        {/* 1px 引线分支符号 */}
        <span className="text-ink-ghost select-none shrink-0 font-mono text-[11px]">⎿</span>

        {/* 工具标识徽标 */}
        <span className="inline-flex items-center gap-1 font-semibold text-ink-heavy shrink-0">
          <Icon
            size={12}
            className={cn('shrink-0', item.state === 'failed' ? 'text-bad' : 'text-ink-subtle')}
          />
          <span>[{mcpName}]</span>
        </span>

        {/* 命令行 / 摘要 */}
        <Tip label={summary} side="top" align="start" disabled={summary.length < 40}>
          <span className="min-w-0 flex-1 truncate text-ink-subtle group-hover/btn:text-ink-body">
            {summary}
          </span>
        </Tip>

        {/* 状态与耗时微标 */}
        <span className="flex shrink-0 items-center gap-1.5 text-[10.5px] tabular-nums text-ink-ghost">
          {duration !== undefined && !running && <span>{formatDuration(duration)}</span>}
          {item.exitCode !== undefined && item.exitCode !== 0 ? (
            <span className="text-bad flex items-center gap-0.5 font-semibold">
              exit {item.exitCode} <X size={11} />
            </span>
          ) : running ? (
            <Loader2 size={11} className="animate-spin text-accent" aria-label="运行中" />
          ) : item.state === 'ok' ? (
            <Check size={11} className="text-ok" aria-label="成功" />
          ) : (
            <X size={11} className="text-bad" aria-label="失败" />
          )}
        </span>

        <Chevron open={expanded} size={11} className="text-ink-ghost group-hover/btn:text-ink-heavy shrink-0" />
      </button>

      {/* 展开态：依托左侧 1px 墨线向下延展，使用极浅底色区分，严禁框中套框 */}
      <Reveal open={expanded}>
        <div className="mt-1 mb-2 ml-1 pl-3.5 py-2.5 border-l border-ink/25 dark:border-white/25 bg-[#FAFAFA]/95 dark:bg-[#121214]/95 rounded-r">
          <Detail item={item} taskId={taskId} />
        </div>
      </Reveal>
    </div>
  );
}
