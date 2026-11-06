/** 右侧检视大盘与多视图切换器 (Drawer View Switcher) */
import { AnimatePresence, motion } from 'motion/react';
import { CheckSquare, FileText, Maximize2, Minimize2, Radio, X } from 'lucide-react';
import { ContextCard } from './ContextCard';
import { TaskCard } from './TaskCard';
import { SreArtifactContent } from '../../components/domain/SreArtifactDrawer';
import { SreNetworkSurfaceView } from '../../components/domain/SreNetworkStorageDial';
import { useCockpitStore, type RightDrawerView } from '../../stores/useCockpitStore';
import { Tip } from '../../components/ui/Tooltip';
import { cn } from '../../utils/text';

interface InspectorProps {
  sessionId: string;
  onClose?: () => void;
}

interface TabItem {
  id: RightDrawerView;
  ariaLabel: string;
  tooltip: string;
  icon: typeof CheckSquare;
}

export function Inspector({ sessionId, onClose }: InspectorProps) {
  const {
    rightDrawerView,
    setRightDrawerView,
    activeArtifact,
    inspectorWide,
    toggleInspectorWide,
  } = useCockpitStore();

  const tabs: TabItem[] = [
    {
      id: 'tasks',
      ariaLabel: '任务与上下文',
      tooltip: '任务进度与 Token 上下文',
      icon: CheckSquare,
    },
    {
      id: 'artifacts',
      ariaLabel: '交付报告',
      tooltip: activeArtifact.title
        ? `交付报告 (${activeArtifact.title})`
        : '交付报告 (inspection_latest.md)',
      icon: FileText,
    },
    {
      id: 'network',
      ariaLabel: '端口暴露面',
      tooltip: '网络拓扑与端口暴露面雷达',
      icon: Radio,
    },
  ];

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-canvas text-ink dark:bg-[#151518] dark:text-zinc-100 font-mono">
      {/* 顶栏：1px 细线极简纯 SVG 分段控制胶囊与关闭栏 (横向宽度收缩 80%，零文字抖动) */}
      <div className="flex h-11 shrink-0 items-center justify-between border-b border-[#2B2A27]/15 bg-subtle px-3 dark:border-white/15 dark:bg-white/[0.02]">
        {/* 纯矢量 SVG 紧凑分段控制器 (Layer 3 GeometricTooltip) */}
        <div
          role="tablist"
          aria-label="审视抽屉视图切换"
          className="inline-flex items-center rounded-md border border-[#2B2A27]/20 p-0.5 bg-canvas dark:border-white/20 dark:bg-[#1C1C20]"
        >
          {tabs.map((tab) => {
            const isActive = rightDrawerView === tab.id;
            const Icon = tab.icon;
            return (
              <Tip key={tab.id} label={tab.tooltip} side="bottom">
                <button
                  role="tab"
                  aria-label={tab.ariaLabel}
                  aria-selected={isActive}
                  onClick={() => setRightDrawerView(tab.id)}
                  className={cn(
                    'flex h-7 w-7 items-center justify-center rounded transition-all select-none',
                    isActive
                      ? 'border border-[#2B2A27] bg-ink text-canvas font-bold shadow-xs dark:border-white dark:bg-white dark:text-ink'
                      : 'border border-transparent text-mute hover:text-ink hover:bg-ink/[0.04] dark:hover:text-zinc-200 dark:hover:bg-white/10',
                  )}
                >
                  <Icon size={14} strokeWidth={1.8} className="shrink-0" />
                </button>
              </Tip>
            );
          })}
        </div>

        {/* 右侧动作控制群：宽屏全览切换 (纯 SVG 容器) + 关闭检视器 */}
        <div className="flex items-center gap-1.5 shrink-0">
          <Tip label={inspectorWide ? '恢复标准宽度' : '切换宽屏大盘模式'}>
            <button
              onClick={toggleInspectorWide}
              aria-label={inspectorWide ? '恢复标准宽度' : '切换宽屏模式'}
              className="flex h-7 w-7 items-center justify-center rounded border border-transparent text-mute transition hover:border-[#2B2A27]/20 hover:bg-ink/[0.04] active:scale-95 dark:hover:border-white/20 dark:hover:bg-white/10 dark:hover:text-zinc-100"
            >
              {inspectorWide ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
            </button>
          </Tip>

          {/* 关闭按钮 */}
          {onClose && (
            <Tip label="关闭检视器 (Ctrl+J)">
              <button
                onClick={onClose}
                aria-label="关闭检视器"
                className="flex h-7 w-7 items-center justify-center rounded border border-transparent hover:border-[#2B2A27]/20 hover:bg-ink/[0.04] active:scale-95 dark:hover:border-white/20 dark:hover:bg-white/10"
              >
                <X size={14} />
              </button>
            </Tip>
          )}
        </div>
      </div>

      {/* 视图内容切换容器 */}
      <div className="min-h-0 flex-1 overflow-hidden relative">
        <AnimatePresence initial={false}>
          {rightDrawerView === 'tasks' && (
            <motion.div
              key="view-tasks"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
              className="h-full w-full space-y-5 overflow-y-auto overflow-x-hidden p-4 font-sans"
            >
              <TaskCard sessionId={sessionId} />
              <div className="border-t border-ink/[0.06] dark:border-white/[0.06]" />
              <ContextCard sessionId={sessionId} />
            </motion.div>
          )}

          {rightDrawerView === 'artifacts' && (
            <motion.div
              key="view-artifacts"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
              className="h-full w-full flex flex-col overflow-hidden"
            >
              <SreArtifactContent isEmbedded onClose={onClose} />
            </motion.div>
          )}

          {rightDrawerView === 'network' && (
            <motion.div
              key="view-network"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
              className="h-full w-full overflow-hidden"
            >
              <SreNetworkSurfaceView />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
