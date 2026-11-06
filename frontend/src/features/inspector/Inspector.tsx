/** 右侧检视大盘与多视图切换器 (Drawer View Switcher) */
import { AnimatePresence, motion } from 'motion/react';
import { FileText, Layers, Maximize2, Minimize2, Network, X } from 'lucide-react';
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
  label: string;
  icon: typeof Layers;
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
    { id: 'tasks', label: '任务与上下文', icon: Layers },
    {
      id: 'artifacts',
      label: activeArtifact.title ? '交付报告 (inspection.md)' : '交付报告',
      icon: FileText,
    },
    { id: 'network', label: '端口暴露面', icon: Network },
  ];

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-canvas text-ink dark:bg-[#151518] dark:text-zinc-100 font-mono">
      {/* 顶栏：1px 细线极简分段控制胶囊与关闭栏 */}
      <div className="flex h-11 shrink-0 items-center justify-between border-b border-[#2B2A27]/15 bg-subtle px-3 dark:border-white/15 dark:bg-white/[0.02]">
        {/* 极简 1px 细线分段控制胶囊 */}
        <div
          role="tablist"
          aria-label="审视抽屉视图切换"
          className="inline-flex items-center rounded-md border border-[#2B2A27]/20 p-0.5 bg-canvas dark:border-white/20 dark:bg-[#1C1C20] text-[10px]"
        >
          {tabs.map((tab) => {
            const isActive = rightDrawerView === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={isActive}
                onClick={() => setRightDrawerView(tab.id)}
                className={cn(
                  'flex items-center gap-1.5 h-6 px-2.5 rounded font-medium transition-all select-none',
                  isActive
                    ? 'bg-ink text-canvas font-bold shadow-xs dark:bg-white dark:text-ink'
                    : 'text-mute hover:text-ink dark:hover:text-zinc-200',
                )}
              >
                <Icon size={12} strokeWidth={1.8} className="shrink-0" />
                <span className="truncate max-w-[140px]">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* 右侧动作控制群：宽屏全览切换 + 关闭检视器 */}
        <div className="flex items-center gap-1.5 shrink-0">
          <Tip label={inspectorWide ? '恢复标准宽度' : '切换宽屏大盘模式'}>
            <button
              onClick={toggleInspectorWide}
              aria-label={inspectorWide ? '恢复标准宽度' : '切换宽屏模式'}
              className="flex h-7 items-center gap-1 rounded border border-transparent px-2 text-[10.5px] font-mono text-mute transition hover:border-[#2B2A27]/20 hover:bg-ink/[0.04] active:scale-95 dark:hover:border-white/20 dark:hover:bg-white/10 dark:hover:text-zinc-100"
            >
              {inspectorWide ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
              <span className="hidden sm:inline">{inspectorWide ? '标准' : '宽屏'}</span>
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
