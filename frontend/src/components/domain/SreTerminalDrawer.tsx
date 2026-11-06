import { AnimatePresence, motion } from 'motion/react';
import {
  Bot,
  CornerDownLeft,
  Maximize2,
  Minimize2,
  SquareTerminal,
  UserCheck,
  X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useCockpitStore } from '../../stores/useCockpitStore';
import { Tip } from '../ui/Tooltip';

/**
 * 实时计算母题 E（声波震荡）路径：y(x, t) = A * sin(wx - phi * t) * exp(-x^2 / 2sigma^2)
 */
function generateOscilloscopePath(
  width: number,
  height: number,
  amplitude: number,
  phase: number,
): string {
  const points: [number, number][] = [];
  const midY = height / 2;
  const numPoints = 40;
  const sigma = width / 4;
  const center = width / 2;

  for (let i = 0; i <= numPoints; i++) {
    const x = (i / numPoints) * width;
    const dx = x - center;
    const gaussian = Math.exp(-(dx * dx) / (2 * sigma * sigma));
    const y = midY - amplitude * Math.sin((x * 0.08) - phase) * gaussian;
    points.push([x, y]);
  }

  return points.reduce((acc, [x, y], idx) => {
    return idx === 0 ? `M ${x.toFixed(1)} ${y.toFixed(1)}` : `${acc} L ${x.toFixed(1)} ${y.toFixed(1)}`;
  }, '');
}

/**
 * SRE 智能作战指挥舱 · Live PTY 终端穿透与人类协同接管台 (Live Terminal & Takeover)
 * 母题 D（折叠对称展开）+ 母题 E（声波震荡）
 * 顶部 1px 细线可拖拽把手（25vh ~ 80vh 弹性伸缩）、1px 心跳波纹、人机接管控制权
 */
export function SreTerminalDrawer() {
  const {
    terminalOpen,
    toggleTerminal,
    takeoverMode,
    setTakeoverMode,
    terminalLogs,
    addTerminalLog,
    terminalHeight,
    setTerminalHeight,
  } = useCockpitStore();

  const [inputCmd, setInputCmd] = useState('');
  const [maximized, setMaximized] = useState(false);
  const [phase, setPhase] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const dragStartYRef = useRef(0);
  const dragStartHeightRef = useRef(0);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // 心跳声波动画循环
  useEffect(() => {
    if (!terminalOpen) return;
    const interval = setInterval(() => {
      setPhase((p) => p + 0.25);
    }, 40);
    return () => clearInterval(interval);
  }, [terminalOpen]);

  // 滚动至最新输出
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [terminalLogs, terminalOpen]);

  // 接管模式切换时聚焦输入框
  useEffect(() => {
    if (takeoverMode === 'human' && terminalOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [takeoverMode, terminalOpen]);

  // 顶部 1px 拖拽把手事件监听 (Cursor: row-resize, 25vh ~ 80vh 弹性伸缩)
  const onPointerDownHandle = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    dragStartYRef.current = e.clientY;
    dragStartHeightRef.current = terminalHeight;
    setIsDragging(true);

    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'row-resize';

    const onPointerMove = (ev: PointerEvent) => {
      const deltaY = dragStartYRef.current - ev.clientY; // 向上拖拽高度增加
      const windowH = typeof window !== 'undefined' ? window.innerHeight : 800;
      const minH = Math.round(windowH * 0.25);
      const maxH = Math.round(windowH * 0.80);
      const nextH = Math.max(minH, Math.min(maxH, dragStartHeightRef.current + deltaY));
      setTerminalHeight(nextH);
      setMaximized(false);
    };

    const onPointerUp = () => {
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
      setIsDragging(false);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  const handleCommandSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = inputCmd.trim();
    if (!cmd) return;

    // 记录人类操作员输入的命令
    addTerminalLog(`$ ${cmd}`, 'input');
    setInputCmd('');

    // 针对 SRE 常见命令提供即时模拟内核返回反馈
    setTimeout(() => {
      if (cmd === 'ulimit -f unlimited') {
        addTerminalLog('[KERNEL] Resource limit updated: file size limit -> unlimited (SIGXFSZ disarmed)', 'system');
      } else if (cmd.includes('cat /proc/pressure/io')) {
        addTerminalLog('some avg10=0.00 avg60=0.00 avg300=84.20 total=14981502\nfull avg10=0.00 avg60=0.00 avg300=0.00 total=0', 'stdout');
      } else if (cmd.startsWith('kill') || cmd.startsWith('pkill')) {
        addTerminalLog(`[SIGNAL] Signal sent to target process: ${cmd}`, 'system');
      } else if (cmd === 'clear') {
        // clear terminal
      } else {
        addTerminalLog(`[EXEC: OK] Command executed by human operator on tty0 (exit_code=0)`, 'stdout');
      }
    }, 150);
  };

  const isHuman = takeoverMode === 'human';
  const waveformAmplitude = isHuman ? 9 : 4; // 接管或活跃时振幅增大

  return (
    <AnimatePresence>
      {terminalOpen && (
        <motion.aside
          key="terminal-drawer"
          aria-label="PTY 终端与人机接管台"
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          style={{
            height: maximized ? '85vh' : `${terminalHeight}px`,
            transition: isDragging ? 'none' : 'height 0.15s ease-out',
          }}
          className="fixed inset-x-0 bottom-0 z-modal flex flex-col border-t border-[#2B2A27] bg-[#FFFFFF] text-[#1A1A1A] shadow-[0_-8px_30px_rgba(43,42,39,0.14)] dark:border-white/30 dark:bg-[#121214] dark:text-zinc-100"
        >
          {/* 顶部拖拽把手 (Cursor: row-resize, 25vh ~ 80vh 弹性伸缩) */}
          <div
            onPointerDown={onPointerDownHandle}
            className="absolute -top-2 inset-x-0 h-4 cursor-row-resize z-30 flex items-center justify-center group"
            aria-label="拖拽调整终端高度"
            role="separator"
            aria-orientation="horizontal"
          >
            <div className="h-1 w-12 rounded-full bg-ink/25 group-hover:bg-ink/70 dark:bg-white/25 dark:group-hover:bg-white/70 transition-colors" />
          </div>

          {/* 顶栏：终端状态、母题 E 声波震荡心跳、人机接管控制权切换 */}
          <div className="flex h-10 shrink-0 items-center justify-between border-b border-[#2B2A27]/15 bg-subtle px-3.5 font-mono text-[11px] text-mute dark:border-white/15 dark:bg-white/[0.02]">
            <div className="flex items-center gap-2">
              <SquareTerminal size={14} className="text-ink dark:text-white shrink-0" />
              <span className="font-semibold text-ink dark:text-white">PTY TTY0 / LIVE HARNESS</span>
              <span className="text-[#2B2A27]/20 dark:text-white/20">|</span>
              <span className="hidden sm:inline text-[10px]">HOST: 127.0.0.1 (BAREMETAL-SRE)</span>
            </div>

            {/* 母题 E：1px 声波震荡实时心跳波纹 (Oscilloscope Waveform) */}
            <div className="hidden md:flex items-center gap-2 px-3">
              <span className="text-[9.5px] tracking-widest text-mute">BUS_LOAD</span>
              <svg width="120" height="20" className="overflow-visible text-ink dark:text-white opacity-80">
                <path
                  d={generateOscilloscopePath(120, 20, waveformAmplitude, phase)}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.2"
                />
              </svg>
            </div>

            {/* 控制器与接管切换开关 (纯 SVG + GeometricTooltip) */}
            <div className="flex items-center gap-2">
              {/* 人机接管开关 (Takeover Switch) - 纯 SVG 容器与 GeometricTooltip */}
              <Tip
                label={
                  isHuman
                    ? '当前处于人类直接接管状态：智能体已挂起，输入救火 Bash 命令。点击交还智能体。'
                    : '当前处于智能体自治观察模式。点击挂起智能体并进入人工直接排障。'
                }
              >
                <button
                  onClick={() => setTakeoverMode(isHuman ? 'autonomous' : 'human')}
                  aria-label="人机接管模式切换"
                  className={`flex h-7 w-7 items-center justify-center rounded border transition active:scale-95 ${
                    isHuman
                      ? 'border-[#D97706] bg-[#D97706]/10 text-[#D97706] dark:border-[#D97706]'
                      : 'border-[#2B2A27]/20 bg-canvas text-ink hover:border-[#2B2A27] dark:border-white/20 dark:text-zinc-200 dark:hover:border-white'
                  }`}
                >
                  {isHuman ? (
                    <UserCheck size={13} className="shrink-0" />
                  ) : (
                    <Bot size={13} className="shrink-0 text-ok" />
                  )}
                  <span className="sr-only">
                    {isHuman ? '人工接管中 · 智能体挂起' : '智能体自治 · 观察模式'}
                  </span>
                </button>
              </Tip>

              {/* 最大化 / 还原 */}
              <Tip label={maximized ? '还原终端视窗' : '全屏展开终端'}>
                <button
                  onClick={() => setMaximized(!maximized)}
                  aria-label={maximized ? '缩小视窗' : '放大视窗'}
                  className="flex h-7 w-7 items-center justify-center rounded border border-[#2B2A27]/15 bg-canvas hover:border-[#2B2A27] dark:border-white/15 dark:hover:border-white"
                >
                  {maximized ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
                </button>
              </Tip>

              {/* 关闭终端 */}
              <Tip label="关闭 PTY 终端 (Ctrl+~)">
                <button
                  onClick={() => toggleTerminal(false)}
                  aria-label="关闭终端"
                  className="flex h-7 w-7 items-center justify-center rounded border border-[#2B2A27]/15 bg-canvas hover:border-[#2B2A27] dark:border-white/15 dark:hover:border-white"
                >
                  <X size={14} />
                </button>
              </Tip>
            </div>
          </div>

          {/* 终端主体输出流与历史 */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-4 font-mono text-[12px] leading-relaxed select-text space-y-1 bg-[#FAFAFA] dark:bg-[#0D0D0E]"
          >
            {terminalLogs.map((log) => (
              <div
                key={log.id}
                className={`whitespace-pre-wrap break-all ${
                  log.type === 'system'
                    ? 'text-mute text-[11px] italic'
                    : log.type === 'input'
                      ? 'text-ink dark:text-zinc-100 font-semibold'
                      : log.type === 'stderr'
                        ? 'text-[#C25B4E]'
                        : 'text-ink/85 dark:text-zinc-300'
                }`}
              >
                {log.text}
              </div>
            ))}

            {/* 接管状态下的实时命令行输入 */}
            {isHuman ? (
              <form onSubmit={handleCommandSubmit} className="mt-2 flex items-center gap-2 pt-1 border-t border-[#2B2A27]/10 dark:border-white/10">
                <span className="font-mono text-[12px] font-bold text-[#D97706] select-none">$</span>
                <input
                  ref={inputRef}
                  type="text"
                  value={inputCmd}
                  onChange={(e) => setInputCmd(e.target.value)}
                  placeholder="输入救火 Bash 命令并按回车执行..."
                  className="flex-1 bg-transparent font-mono text-[12px] text-ink outline-none placeholder:text-mute/50 dark:text-zinc-100"
                />
                <span className="h-4 w-2 bg-[#D97706] animate-pulse shrink-0" />
                <Tip label="执行救火命令 (Enter)">
                  <button
                    type="submit"
                    aria-label="执行命令"
                    className="flex h-6 w-6 items-center justify-center rounded border border-[#2B2A27]/20 hover:border-[#2B2A27] dark:border-white/20"
                  >
                    <CornerDownLeft size={11} />
                  </button>
                </Tip>
              </form>
            ) : (
              <div className="flex items-center gap-1.5 pt-1 text-[11px] text-mute">
                <span className="h-3 w-1.5 border border-dashed border-ink/40 dark:border-white/40" />
                <span className="italic">智能体自治运行中 · 点击上方「人机协作模式」可进入实时命令行排障</span>
              </div>
            )}
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
