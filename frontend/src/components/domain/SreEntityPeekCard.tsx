import { AnimatePresence, motion } from 'motion/react';
import {
  Activity,
  Check,
  Copy,
  Cpu,
  FileCode,
  Network,
  Radio,
  ShieldCheck,
  Terminal,
} from 'lucide-react';
import {
  useCallback,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { useAnchor } from '../ui/useAnchor';

const IS_TEST = typeof process !== 'undefined' && process.env?.NODE_ENV === 'test';

export interface SreEntityInfo {
  key: string;
  title: string;
  category: string;
  tagColor: 'warn' | 'ok' | 'neutral' | 'danger';
  icon: typeof Radio;
  summary: string;
  specs: { label: string; value: string }[];
  commandToCopy?: string;
  commandLabel?: string;
  statusBadge?: string;
}

export const SRE_ENTITIES: Record<string, SreEntityInfo> = {
  SIGXFSZ: {
    key: 'SIGXFSZ',
    title: 'SIGXFSZ (Signal 25)',
    category: 'POSIX 信号定义',
    tagColor: 'warn',
    icon: Radio,
    summary: '文件大小超出配额 (File size limit exceeded)。当进程写入超出当前 Shell 的 ulimit -f 限制时由内核投递。',
    specs: [
      { label: '默认处置', value: 'Core Dump · 终止进程并产生转储' },
      { label: '触发场景', value: '重定向输出或落盘超出软上限限制' },
      { label: '防御修复', value: '调大限制或执行 ulimit -f unlimited' },
    ],
    commandToCopy: 'ulimit -f unlimited',
    commandLabel: '复制解除限制命令',
    statusBadge: '需处理 · P2',
  },
  '/usr/bin/head': {
    key: '/usr/bin/head',
    title: '/usr/bin/head',
    category: '二进制探针',
    tagColor: 'neutral',
    icon: FileCode,
    summary: 'Linux 核心工具集组件，用于截取文件前部或数据流头部，属于合规系统基线白名单程序。',
    specs: [
      { label: '所属软件包', value: 'coreutils (8.32 / GNU)' },
      { label: '文件权限', value: '-rwxr-xr-x (0755 / root:root)' },
      { label: '文件尺寸', value: '42.1 KB (静态哈希校验通过)' },
      { label: '安全判定', value: '良性系统工具 · 未篡改' },
    ],
    commandToCopy: '/usr/bin/head',
    commandLabel: '复制程序路径',
    statusBadge: '已定性 · 良性',
  },
  'IO pressure 86%': {
    key: 'IO pressure 86%',
    title: 'IO Pressure (PSI 86%)',
    category: '内核 PSI 压力',
    tagColor: 'warn',
    icon: Activity,
    summary: 'Pressure Stall Information 指标。表示过去采样窗口内至少一个任务等待 I/O 的时间占比。',
    specs: [
      { label: '统计窗口', value: 'avg300 (5 分钟加权衰减均值)' },
      { label: '实时差分', value: '58 IOPS ｜ 读: 0 MB/s ｜ 写: 1.2 MB/s' },
      { label: '排查结论', value: '历史瞬时峰值残留衰减，当前物理 I/O 无堵塞' },
    ],
    commandToCopy: 'cat /proc/pressure/io',
    commandLabel: '查看实时 PSI 指标',
    statusBadge: '指标纠偏 · 属误读',
  },
  'IO pressure': {
    key: 'IO pressure',
    title: 'IO Pressure (PSI)',
    category: '内核 PSI 压力',
    tagColor: 'warn',
    icon: Activity,
    summary: 'Pressure Stall Information 指标。用于检测 CPU、内存与磁盘 I/O 硬件停顿百分比。',
    specs: [
      { label: '统计窗口', value: 'avg10 / avg60 / avg300' },
      { label: '实时差分', value: '58 IOPS ｜ 读: 0 MB/s ｜ 写: 1.2 MB/s' },
      { label: '排查结论', value: '历史残留延迟，当前物理 I/O 无堵塞' },
    ],
    commandToCopy: 'cat /proc/pressure/io',
    commandLabel: '查看实时 PSI 指标',
    statusBadge: '指标纠偏 · 属误读',
  },
  'taint=12288': {
    key: 'taint=12288',
    title: 'Kernel Taint (掩码 12288)',
    category: '内核污染标志',
    tagColor: 'ok',
    icon: Cpu,
    summary: '内核运行状态污染位掩码。通过二进制按位分解判定内核是否处于受支持的预期状态。',
    specs: [
      { label: '掩码分解', value: 'Bit 12 (4096: O-闭源驱动) + Bit 13 (8192: E-未签名)' },
      { label: '根因归属', value: '由宿主机搭载的官方 NVIDIA 专有显卡驱动引起' },
      { label: '稳定性评级', value: '生产预期内 · 稳定性正常' },
    ],
    commandToCopy: 'cat /proc/sys/kernel/tainted',
    commandLabel: '查看污染位掩码',
    statusBadge: '已定性 · 良性',
  },
  'docker-forwarding': {
    key: 'docker-forwarding',
    title: 'docker-forwarding',
    category: '网络路由规则冲突',
    tagColor: 'danger',
    icon: Network,
    summary: 'firewalld 与 Docker 默认 FORWARD 链规则重叠冲突，导致跨容器通信或端口映射可能偶发丢包。',
    specs: [
      { label: '冲突链域', value: 'iptables filter FORWARD / DOCKER-USER' },
      { label: '影响范围', value: '容器与宿主机跨网桥握手延迟或握手包丢失' },
      { label: '安全修复', value: '将 docker0 网桥纳入 firewalld trusted 区域' },
    ],
    commandToCopy: 'firewall-cmd --permanent --zone=trusted --add-interface=docker0 && firewall-cmd --reload',
    commandLabel: '复制网桥信任配置命令',
    statusBadge: '待处置 · P1',
  },
};

export function SreEntityPeek({
  entityKey,
  children,
}: {
  entityKey: string;
  children: ReactNode;
}) {
  const entity = SRE_ENTITIES[entityKey];
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const anchorRef = useRef<HTMLSpanElement | null>(null);
  const popRef = useRef<HTMLDivElement | null>(null);

  const openTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const placement = useAnchor(open, anchorRef, popRef, 'top', 'start');

  const handleMouseEnter = useCallback(() => {
    clearTimeout(closeTimer.current);
    clearTimeout(openTimer.current);
    // 规范规定：悬停 200ms 触发，防止光标扫过误弹
    openTimer.current = setTimeout(() => {
      setOpen(true);
    }, 200);
  }, []);

  const handleMouseLeave = useCallback(() => {
    clearTimeout(openTimer.current);
    // 规范规定：移出带 150ms 宽容度，允许移入卡片点击复制
    closeTimer.current = setTimeout(() => {
      setOpen(false);
    }, 150);
  }, []);

  const handleCopy = (text: string) => {
    void navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };

  if (!entity) return <>{children}</>;

  const Icon = entity.icon;

  return (
    <>
      <span
        ref={anchorRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="inline cursor-help font-mono border-b border-dashed border-ink/40 text-ink/90 transition-colors hover:border-ink hover:text-ink dark:border-white/40 dark:text-zinc-200 dark:hover:border-white"
      >
        {children}
      </span>

      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {open && (
              <motion.div
                ref={popRef}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                initial={IS_TEST ? false : { opacity: 0, scale: 0.96, y: 4 }}
                animate={{ opacity: placement ? 1 : 0, scale: 1, y: 0 }}
                exit={IS_TEST ? undefined : { opacity: 0, scale: 0.96, y: 4 }}
                transition={IS_TEST ? { duration: 0 } : { duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
                style={{
                  position: 'fixed',
                  top: placement?.top ?? 0,
                  left: placement?.left ?? 0,
                }}
                className="z-[55] w-[340px] max-w-[92vw] rounded-lg border border-[#2B2A27] bg-white p-3.5 text-ink shadow-[0_12px_36px_rgba(43,42,39,0.18)] dark:border-white/30 dark:bg-[#18181B] dark:text-zinc-100 dark:shadow-[0_12px_36px_rgba(0,0,0,0.7)]"
              >
                {/* 顶栏：类别与微型状态徽标 */}
                <div className="flex items-center justify-between border-b border-ink/[0.08] pb-2 dark:border-white/[0.08]">
                  <div className="flex items-center gap-1.5 font-mono text-[11px] font-semibold text-mute">
                    <Icon size={13} className="text-ink dark:text-white" />
                    <span>{entity.category}</span>
                  </div>
                  {entity.statusBadge && (
                    <span
                      className={`sre-tag ${
                        entity.tagColor === 'ok'
                          ? 'sre-tag-ok'
                          : entity.tagColor === 'warn'
                            ? 'sre-tag-warn'
                            : entity.tagColor === 'danger'
                              ? 'sre-tag-danger'
                              : 'sre-tag-neutral'
                      }`}
                    >
                      {entity.tagColor === 'ok' && <ShieldCheck size={10} />}
                      {entity.statusBadge}
                    </span>
                  )}
                </div>

                {/* 主题实体名称 */}
                <h4 className="mt-2 font-mono text-[13.5px] font-bold text-ink dark:text-white">
                  {entity.title}
                </h4>

                {/* 摘要说明 */}
                <p className="mt-1 text-xs leading-relaxed text-secondary dark:text-zinc-300">
                  {entity.summary}
                </p>

                {/* 核心参数矩阵 */}
                <div className="mt-2.5 space-y-1 rounded border border-ink/[0.06] bg-ink/[0.02] p-2 dark:border-white/[0.06] dark:bg-white/[0.02]">
                  {entity.specs.map((spec, i) => (
                    <div key={i} className="flex items-start justify-between gap-2 text-[11px]">
                      <span className="font-mono text-mute shrink-0">{spec.label}</span>
                      <span className="font-mono text-right font-medium text-ink/90 dark:text-zinc-200 break-all">
                        {spec.value}
                      </span>
                    </div>
                  ))}
                </div>

                {/* 底部一键复制动作 */}
                {entity.commandToCopy && (
                  <div className="mt-3 flex items-center justify-between gap-2 border-t border-ink/[0.06] pt-2 dark:border-white/[0.06]">
                    <div className="flex items-center gap-1 font-mono text-[10px] text-mute truncate">
                      <Terminal size={11} className="shrink-0" />
                      <span className="truncate">{entity.commandToCopy}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(entity.commandToCopy as string)}
                      className="inline-flex shrink-0 items-center gap-1 rounded border border-ink/[0.15] bg-ink/[0.03] px-2 py-1 font-mono text-[10.5px] font-medium text-ink transition hover:border-[#2B2A27] hover:bg-[#2B2A27] hover:text-white active:scale-95 dark:border-white/20 dark:bg-white/[0.04] dark:hover:border-white dark:hover:bg-white dark:hover:text-[#18181B]"
                    >
                      {copied ? <Check size={11} className="text-ok" /> : <Copy size={11} />}
                      <span>{copied ? '已复制' : '复制命令'}</span>
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </>
  );
}
