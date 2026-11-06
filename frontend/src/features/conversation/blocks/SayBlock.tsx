/**
 * 通道 B：Agent 阶段思考与决策 (Agent Voice)
 * SRE 决策微视窗：
 * - 左侧配备 2px 墨黑 (#1A1A1A / dark: #E4E4E7) 实体坚韧边条（以线代面，上下无框）；
 * - 顶部增加参数微标：font-mono text-[10px] text-mute: "● SRE INFERENCE (第 N 回合)"；
 * - 字阶灰度：
 *   * 核心标签 【现状】与【下一步】：--ink-heavy (#1A1A1A) + font-semibold text-[13.5px]
 *   * 推演正文：--ink-body (#505050) + text-[13px] leading-relaxed
 *   * 实体代码：1px 微边框代码微标包裹
 */
import { SafeMarkdown } from '../../../components/common/SafeMarkdown';
import { parseSay, type TimelineItem } from '../../../stores/taskReducer';

type Item = Extract<TimelineItem, { kind: 'say' }>;

export function SayBlock({ item }: { item: Item }) {
  const { body, progress } = parseSay(item.text);
  const turn = item.turn;

  return (
    <div className="relative my-3 pl-3.5 py-1.5 border-l-2 border-[#1A1A1A] dark:border-[#E4E4E7] transition-all">
      {/* 顶部参数微标：确立高反差 SRE 决策身份 */}
      <div className="mb-1.5 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-mute select-none">
        <span className="h-1.5 w-1.5 rounded-full bg-[#1A1A1A] dark:bg-white shrink-0" />
        <span className="font-semibold text-ink-heavy dark:text-zinc-200">SRE INFERENCE</span>
        {turn !== undefined && (
          <>
            <span className="text-ink-ghost">|</span>
            <span>第 {turn} 回合</span>
          </>
        )}
      </div>

      {/* 推演与汇报正文：Editorial 字阶 (13px / 1.6) + Level 2 灰度 (#505050) */}
      <div className="text-[13px] leading-relaxed text-ink-body font-sans select-text">
        <SafeMarkdown text={body || item.text} />
        {item.streaming && (
          <span className="ml-1 inline-block h-3.5 w-1.5 translate-y-0.5 animate-pulse bg-ink-heavy dark:bg-white" />
        )}
      </div>

      {/* 阶段性进度条展示 */}
      {progress && (
        <div className="mt-2.5 flex items-center gap-2 font-mono text-[10px] text-mute">
          <div className="h-[2px] w-24 overflow-hidden rounded-full bg-ink/[0.08] dark:bg-white/[0.1]">
            <div
              className="h-full rounded-full bg-ink dark:bg-white transition-[width] duration-500"
              style={{ width: `${progress.percent}%` }}
            />
          </div>
          <span className="tabular-nums">{progress.percent}%</span>
          {progress.label && <span className="truncate">{progress.label}</span>}
        </div>
      )}
    </div>
  );
}
