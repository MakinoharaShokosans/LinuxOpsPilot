import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

/**
 * omoi-aesthetic 五幕式图纸自检开机动画 (The 5-Act SRE Boot Sequence)
 * 严格遵循 2.2s ~ 2.4s 从容建筑图纸时序：
 * Act 1: 十字准星定点 (0 ~ 400ms)
 * Act 2: 规尺引线与遥测微标 (400 ~ 950ms)
 * Act 3: 1px 扫线激光扫描与图纸展开 (950 ~ 1600ms)
 * Act 4: 辅助标尺吸附蜕变 (1600 ~ 2100ms)
 * Act 5: 盖戳就绪与平滑入场 (2100 ~ 2350ms)
 */
export function SreBootSplash({ force }: { force?: boolean } = {}) {
  const [visible, setVisible] = useState(() => {
    if (force) return true;
    if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'test') return false;
    // 强制原则：每次硬刷新必定触发，不使用 sessionStorage 阻止重新播放
    return true;
  });

  const [act, setAct] = useState<1 | 2 | 3 | 4 | 5>(1);

  useEffect(() => {
    if (!visible) return;

    const t2 = setTimeout(() => setAct(2), 400);
    const t3 = setTimeout(() => setAct(3), 950);
    const t4 = setTimeout(() => setAct(4), 1600);
    const t5 = setTimeout(() => setAct(5), 2100);
    const tEnd = setTimeout(() => {
      setVisible(false);
    }, 2350);

    return () => {
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(t5);
      clearTimeout(tEnd);
    };
  }, [visible]);

  if (!visible) return null;

  return (
    <AnimatePresence>
      <motion.div
        aria-hidden="true"
        role="presentation"
        className="pointer-events-none fixed inset-0 z-modal flex items-center justify-center overflow-hidden bg-canvas select-none"
        initial={{ opacity: 1 }}
        animate={{ opacity: act === 5 ? 0 : 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* 背景 1px 工程网格水印 */}
        <div
          className="absolute inset-0 opacity-[0.035] dark:opacity-[0.05]"
          style={{
            backgroundImage:
              'linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />

        {/* 视口四角 1px 工程直角规尺标记 */}
        <div className="absolute left-6 top-6 h-3 w-3 border-l border-t border-[#2B2A27]/40 dark:border-white/40" />
        <div className="absolute right-6 top-6 h-3 w-3 border-r border-t border-[#2B2A27]/40 dark:border-white/40" />
        <div className="absolute bottom-6 left-6 h-3 w-3 border-b border-l border-[#2B2A27]/40 dark:border-white/40" />
        <div className="absolute bottom-6 right-6 h-3 w-3 border-b border-r border-[#2B2A27]/40 dark:border-white/40" />

        {/* Act 2, 3, 4: 四方标尺引线与虚线网格骨架 */}
        {act >= 2 && act < 5 && (
          <>
            {/* 水平十字轴虚线 */}
            <motion.div
              className="absolute left-0 right-0 h-[1px] border-b border-dashed border-[#2B2A27]/25 dark:border-white/25"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: act === 4 ? 0.98 : 1, opacity: act === 4 ? 0.3 : 1 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            />
            {/* 垂直十字轴虚线 */}
            <motion.div
              className="absolute bottom-0 top-0 w-[1px] border-r border-dashed border-[#2B2A27]/25 dark:border-white/25"
              initial={{ scaleY: 0 }}
              animate={{ scaleY: act === 4 ? 0.98 : 1, opacity: act === 4 ? 0.3 : 1 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            />

            {/* Act 2 遥测微标参数 (Telemetry Micro-Tags) */}
            <motion.div
              className="absolute top-1/2 -translate-y-12 flex items-center gap-2 font-mono text-[11px] tracking-wider text-ink/80 dark:text-zinc-200"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: -12 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            >
              <span className="rounded border border-[#2B2A27]/15 bg-canvas px-2 py-0.5 shadow-sm dark:border-white/15">
                HOST: 127.0.0.1
              </span>
              <span className="text-[#2B2A27]/30 dark:text-white/30">|</span>
              <span className="rounded border border-[#2B2A27]/15 bg-canvas px-2 py-0.5 shadow-sm dark:border-white/15">
                KERNEL: 6.8.0-sre
              </span>
              <span className="text-[#2B2A27]/30 dark:text-white/30">|</span>
              <span className="rounded border border-[#2B2A27]/15 bg-canvas px-2 py-0.5 shadow-sm dark:border-white/15">
                PROBES: ATTACHED
              </span>
            </motion.div>

            {/* 下部自检状态行 */}
            <motion.div
              className="absolute top-1/2 translate-y-10 flex items-center gap-2 font-mono text-[10px] tracking-widest text-mute"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 10 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            >
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-ok animate-pulse" />
              <span>STATUS: {act === 3 ? 'CATALYZING_BLUEPRINT' : act === 4 ? 'STRUCT_FINALIZING' : 'BOOTING'}</span>
              <span className="text-ink/20 dark:text-white/20">|</span>
              <span>DRAFT_ENGINE: 5_ACTS</span>
            </motion.div>
          </>
        )}

        {/* Act 1 & 2 & 3: 屏幕中央工程十字准星 */}
        {act < 5 && (
          <motion.div
            className="relative flex h-16 w-16 items-center justify-center"
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* 四角直角标尺框 */}
            <div className="absolute left-1 top-1 h-2.5 w-2.5 border-l border-t border-[#2B2A27] dark:border-white" />
            <div className="absolute right-1 top-1 h-2.5 w-2.5 border-r border-t border-[#2B2A27] dark:border-white" />
            <div className="absolute bottom-1 left-1 h-2.5 w-2.5 border-b border-l border-[#2B2A27] dark:border-white" />
            <div className="absolute bottom-1 right-1 h-2.5 w-2.5 border-b border-r border-[#2B2A27] dark:border-white" />

            {/* 准星十字与中心绿点 */}
            <svg width="24" height="24" viewBox="0 0 24 24" className="text-ink dark:text-white">
              <line x1="12" y1="2" x2="12" y2="8" stroke="currentColor" strokeWidth="1" strokeOpacity="0.8" />
              <line x1="12" y1="16" x2="12" y2="22" stroke="currentColor" strokeWidth="1" strokeOpacity="0.8" />
              <line x1="2" y1="12" x2="8" y2="12" stroke="currentColor" strokeWidth="1" strokeOpacity="0.8" />
              <line x1="16" y1="12" x2="22" y2="12" stroke="currentColor" strokeWidth="1" strokeOpacity="0.8" />
              <circle cx="12" cy="12" r="1.5" fill="#2E7D32" />
            </svg>
          </motion.div>
        )}

        {/* Act 3: 1px 扫线激光扫描与图纸催化 (Sweep Line Catalyst) */}
        {act === 3 && (
          <>
            <motion.div
              className="absolute left-0 right-0 h-[1.5px] bg-[#2B2A27] shadow-[0_0_12px_rgba(43,42,39,0.4)] dark:bg-white dark:shadow-[0_0_12px_rgba(255,255,255,0.5)]"
              initial={{ top: '0%', scaleX: 0.2 }}
              animate={{ top: ['0%', '100%'], scaleX: [0.2, 1] }}
              transition={{ duration: 0.65, ease: 'linear' }}
            />
            {/* 扫线催化出的三栏图纸矢量外框模拟 */}
            <div className="absolute inset-x-8 inset-y-12 flex gap-4 pointer-events-none opacity-40">
              <div className="w-56 rounded border border-[#2B2A27]/30 dark:border-white/30" />
              <div className="flex-1 rounded border border-[#2B2A27]/30 dark:border-white/30" />
              <div className="w-80 rounded border border-[#2B2A27]/30 dark:border-white/30" />
            </div>
          </>
        )}

        {/* Act 5: 盖戳就绪状态 (● SRE HARNESS ONLINE) */}
        {act === 5 && (
          <motion.div
            className="flex items-center gap-2 rounded-lg border border-[#2B2A27]/25 bg-canvas px-4 py-2 font-mono text-[12px] font-semibold text-ink shadow-md dark:border-white/30 dark:text-white"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          >
            <span className="h-2 w-2 rounded-full bg-ok animate-pulse" />
            <span>SRE HARNESS ONLINE · READY</span>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
