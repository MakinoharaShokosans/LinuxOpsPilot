/**
 * SreSettingsModal: 原地几何配置小视窗 (Layer 2 规范)
 * 严格遵循 omoi-aesthetic: 860x600px 黄金画框，纯白底色 #FFFFFF，1px 墨线 #2B2A27，
 * 4% 墨黑变暗与 backdrop-blur-[2px]，母题 D 对称展开阻尼。
 */
import { useEffect, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Activity,
  Cpu,
  FileText,
  Plug,
  SlidersHorizontal,
  Sparkles,
  Wrench,
  X,
} from 'lucide-react';
import { GeometricTooltip } from '../../components/ui/Tooltip';
import { usePendingStore } from '../../stores/usePendingStore';
import { useUiStore, type SettingsSection } from '../../stores/useUiStore';
import { cn } from '../../utils/text';
import { Diagnostics } from './sections/Diagnostics';
import { General } from './sections/General';
import { Mcp } from './sections/Mcp';
import { Models } from './sections/Models';
import { Prompts } from './sections/Prompts';
import { Skills } from './sections/Skills';
import { Tools } from './sections/Tools';

interface NavSection {
  id: SettingsSection;
  label: string;
  icon: typeof Cpu;
  render: () => ReactNode;
}

const SECTIONS: NavSection[] = [
  { id: 'general', label: '通用', icon: SlidersHorizontal, render: () => <General /> },
  { id: 'models', label: '模型', icon: Cpu, render: () => <Models /> },
  { id: 'skills', label: '技能', icon: Sparkles, render: () => <Skills /> },
  { id: 'mcp', label: 'MCP', icon: Plug, render: () => <Mcp /> },
  { id: 'tools', label: '工具', icon: Wrench, render: () => <Tools /> },
  { id: 'prompts', label: '提示词', icon: FileText, render: () => <Prompts /> },
  { id: 'diagnostics', label: '诊断', icon: Activity, render: () => <Diagnostics /> },
];

export function SreSettingsModal() {
  const open = useUiStore((s) => s.settingsOpen);
  const setOpen = useUiStore((s) => s.setSettingsOpen);
  const activeSection = useUiStore((s) => s.settingsSection);
  const setSection = useUiStore((s) => s.setSettingsSection);
  const pending = usePendingStore((s) => s.count);

  // Esc 键盘关闭监听
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, setOpen]);

  const current = (SECTIONS.find((s) => s.id === activeSection) ?? SECTIONS[0])!;

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-modal flex items-center justify-center p-3 sm:p-6">
          {/* Layer 2 空间景深暗化：4% 墨黑变暗 + backdrop-blur-[2px] */}
          <motion.div
            key="scrim"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 bg-ink/4 backdrop-blur-[2px] dark:bg-black/40"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />

          {/* 黄金比例几何图纸视窗 (860x600px) · 母题 D 对称展开 */}
          <motion.div
            key="modal-card"
            role="dialog"
            aria-modal="true"
            aria-label="系统配置小视窗"
            initial={{ opacity: 0, scaleY: 0.05, scaleX: 0.96 }}
            animate={{ opacity: 1, scaleY: 1, scaleX: 1 }}
            exit={{
              opacity: 0,
              scaleY: 0.05,
              scaleX: 0.96,
              transition: { duration: 0.18, ease: 'easeIn' },
            }}
            transition={{
              duration: 0.25,
              ease: [0.16, 1, 0.3, 1],
            }}
            className={cn(
              'relative z-10 flex flex-col w-[860px] h-[600px] max-w-[calc(100vw-24px)] max-h-[calc(100vh-24px)]',
              'rounded-lg border border-[#2B2A27] bg-white text-ink shadow-2xl overflow-hidden',
              'dark:border-white/20 dark:bg-[#141414] dark:text-white',
            )}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header: h-12 (48px) 紧凑工程标尺头 */}
            <header className="h-12 shrink-0 border-b border-ink/10 dark:border-white/10 px-4 flex items-center justify-between bg-[#FAFAFA] dark:bg-[#181818]">
              <div className="flex items-center gap-2 min-w-0">
                <span className="h-2 w-2 rounded-full bg-ok shadow-[0_0_6px_rgb(var(--c-ok)/0.6)]" />
                <span className="font-mono text-[11px] font-semibold tracking-wider text-ink/80 dark:text-white/80 uppercase">
                  SYSTEM CONFIGURATION ｜ ENGINE SRE v0.2.0
                </span>
              </div>

              <div className="flex items-center gap-2">
                {pending > 0 && (
                  <GeometricTooltip label="当前有变更待下次任务运行时热重载生效">
                    <span className="inline-flex items-center gap-1.5 rounded border border-warn/30 bg-warn/10 px-2 py-0.5 font-mono text-[10.5px] font-semibold text-warn">
                      <span className="h-1.5 w-1.5 rounded-full bg-warn" />
                      {pending} PENDING
                    </span>
                  </GeometricTooltip>
                )}

                <GeometricTooltip label="关闭配置视窗 (Esc)">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="w-8 h-8 rounded-md flex items-center justify-center text-mute hover:text-ink hover:bg-ink/5 dark:hover:text-white dark:hover:bg-white/5 transition-colors border border-transparent hover:border-ink/15 dark:hover:border-white/20"
                    aria-label="关闭配置视窗"
                  >
                    <X size={15} />
                  </button>
                </GeometricTooltip>
              </div>
            </header>

            {/* Body: 左侧 160px 纯矢量图标导航 + 右侧主内容区 */}
            <div className="flex min-h-0 flex-1">
              {/* 左侧 160px 导航 */}
              <nav
                aria-label="配置导航"
                className="w-[160px] shrink-0 border-r border-ink/10 dark:border-white/10 p-2 flex flex-col gap-1 bg-[#FAFAFA] dark:bg-[#181818]"
              >
                {SECTIONS.map((sec) => {
                  const active = sec.id === current.id;
                  const Icon = sec.icon;
                  return (
                    <button
                      key={sec.id}
                      type="button"
                      onClick={() => setSection(sec.id)}
                      className={cn(
                        'flex items-center gap-2.5 px-3 py-2 rounded-md font-mono text-[12px] transition-colors w-full text-left',
                        active
                          ? 'bg-[#2B2A27] text-white dark:bg-white dark:text-[#121212] font-semibold shadow-sm'
                          : 'text-mute hover:bg-ink/5 hover:text-ink dark:hover:bg-white/5 dark:hover:text-white',
                      )}
                    >
                      <Icon size={14} className="shrink-0" />
                      <span className="truncate">{sec.label}</span>
                    </button>
                  );
                })}
              </nav>

              {/* 右侧主视窗内容区 (120ms 轻微平移淡入) */}
              <div className="flex-1 min-w-0 min-h-0 overflow-y-auto p-5 relative bg-white dark:bg-[#141414]">
                <motion.div
                  key={current.id}
                  initial={{ opacity: 0, x: 4 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.12, ease: 'easeOut' }}
                  className="h-full"
                >
                  {current.render()}
                </motion.div>
              </div>
            </div>

            {/* Footer: h-12 (48px) 细线底界 */}
            <footer className="h-12 shrink-0 border-t border-ink/10 dark:border-white/10 px-4 flex items-center justify-between bg-[#FAFAFA] dark:bg-[#181818]">
              <div className="flex items-center gap-1.5 font-mono text-[11px] text-mute">
                <span className="h-1.5 w-1.5 rounded-full bg-ok" />
                <span>ESC 键退出 · 实时就地生效</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="inline-flex items-center justify-center rounded border border-[#2B2A27] bg-[#2B2A27] text-white dark:border-white dark:bg-white dark:text-[#121212] px-3.5 py-1 font-mono text-xs font-semibold hover:opacity-90 transition-opacity"
                >
                  完成配置
                </button>
              </div>
            </footer>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
