import { motion } from 'motion/react';
import { HardDrive, Network, ShieldAlert, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { GeometricTooltip } from '../ui/Tooltip';
import { cn } from '../../utils/text';

export interface PortItem {
  id: string;
  port: number;
  proto: 'TCP' | 'UDP';
  bind: '127.0.0.1' | '0.0.0.0';
  pid: number;
  proc: string;
  status: 'LISTEN' | 'ESTABLISHED';
  level: 'safe' | 'warn' | 'danger';
  riskLabel: string;
}

export const PORTS: PortItem[] = [
  { id: 'p1', port: 5432, proto: 'TCP', bind: '127.0.0.1', pid: 1042, proc: 'postgres', status: 'LISTEN', level: 'safe', riskLabel: 'SECURE · 回环' },
  { id: 'p2', port: 6379, proto: 'TCP', bind: '127.0.0.1', pid: 1120, proc: 'redis-server', status: 'LISTEN', level: 'safe', riskLabel: 'SECURE · 回环' },
  { id: 'p3', port: 9090, proto: 'TCP', bind: '127.0.0.1', pid: 1205, proc: 'prometheus', status: 'LISTEN', level: 'safe', riskLabel: 'SECURE · 回环' },
  { id: 'p4', port: 22, proto: 'TCP', bind: '0.0.0.0', pid: 820, proc: 'sshd', status: 'LISTEN', level: 'warn', riskLabel: 'WARN · 监听' },
  { id: 'p5', port: 80, proto: 'TCP', bind: '0.0.0.0', pid: 940, proc: 'caddy', status: 'LISTEN', level: 'warn', riskLabel: 'WARN · 监听' },
  { id: 'p6', port: 443, proto: 'TCP', bind: '0.0.0.0', pid: 940, proc: 'caddy', status: 'LISTEN', level: 'warn', riskLabel: 'WARN · 监听' },
  { id: 'p7', port: 1716, proto: 'UDP', bind: '0.0.0.0', pid: 1716, proc: 'kdeconnectd', status: 'LISTEN', level: 'danger', riskLabel: 'CRITICAL · 暴露' },
];

function getPortAngleDeg(port: number): number {
  if (port <= 1024) {
    // 0 ~ 1024 特权端口: 15° ~ 105°
    return 15 + (port / 1024) * 90;
  } else if (port <= 10000) {
    // 1024 ~ 10000 业务端口: 120° ~ 255°
    return 120 + ((port - 1024) / 8976) * 135;
  } else {
    // 10000 ~ 65535 高位端口: 270° ~ 345°
    return 270 + ((port - 10000) / 55535) * 75;
  }
}

/**
 * 母题 A：高精密度 240px 极坐标雷达 (Polar Radar 240px)
 * 直径 240px，1px 细线同心圆，0~65535 极轴标尺，双向联动磁吸导线
 */
export function SrePolarRadar240({
  hoveredPortId,
  onHoverPort,
}: {
  hoveredPortId: string | null;
  onHoverPort: (id: string | null) => void;
}) {
  const center = 120;
  const innerRadius = 55;  // 127.0.0.1 翠墨绿回环轨
  const outerRadius = 96;  // 0.0.0.0 朱砂红/琥珀公网暴露面轨

  const activePort = PORTS.find((p) => p.id === hoveredPortId) ?? null;
  let activeCoord: { x: number; y: number } | null = null;
  if (activePort) {
    const isLocal = activePort.bind === '127.0.0.1';
    const r = isLocal ? innerRadius : outerRadius;
    const angleRad = (getPortAngleDeg(activePort.port) * Math.PI) / 180;
    activeCoord = {
      x: center + r * Math.sin(angleRad),
      y: center - r * Math.cos(angleRad),
    };
  }

  return (
    <div className="relative flex flex-col items-center select-none font-mono">
      <div className="relative h-[240px] w-[240px]">
        <svg width="240" height="240" className="overflow-visible" aria-label="网络暴露面 240px 极坐标雷达大盘">
          {/* 十字基准轴（终止于刻度前，绝不穿透切断文字） */}
          <line
            x1="26"
            y1={center}
            x2="214"
            y2={center}
            stroke="currentColor"
            strokeWidth="0.8"
            strokeDasharray="3 3"
            className="text-ink/20 dark:text-white/20"
          />
          <line
            x1={center}
            y1="24"
            x2={center}
            y2="216"
            stroke="currentColor"
            strokeWidth="0.8"
            strokeDasharray="3 3"
            className="text-ink/20 dark:text-white/20"
          />

          {/* 45° 辅助虚线标尺 */}
          <line
            x1="48"
            y1="48"
            x2="192"
            y2="192"
            stroke="currentColor"
            strokeWidth="0.6"
            strokeDasharray="2 4"
            className="text-ink/15 dark:text-white/15"
          />
          <line
            x1="192"
            y1="48"
            x2="48"
            y2="192"
            stroke="currentColor"
            strokeWidth="0.6"
            strokeDasharray="2 4"
            className="text-ink/15 dark:text-white/15"
          />

          {/* 外圈公网暴露轨 (0.0.0.0) */}
          <circle
            cx={center}
            cy={center}
            r={outerRadius}
            fill="none"
            stroke="#C25B4E"
            strokeWidth="1"
            strokeDasharray="4 4"
            strokeOpacity="0.45"
          />

          {/* 内圈内网回环轨 (127.0.0.1) */}
          <circle
            cx={center}
            cy={center}
            r={innerRadius}
            fill="none"
            stroke="#437A58"
            strokeWidth="1"
            strokeDasharray="3 3"
            strokeOpacity="0.55"
          />

          {/* 四向端口刻度微印（外移防切） */}
          <text x={center} y="14" textAnchor="middle" className="text-[8px] fill-current text-mute/80">
            0 / 65535
          </text>
          <text x="230" y="123" textAnchor="start" className="text-[8px] fill-current text-mute/80">
            16384
          </text>
          <text x={center} y="234" textAnchor="middle" className="text-[8px] fill-current text-mute/80">
            32768
          </text>
          <text x="10" y="123" textAnchor="end" className="text-[8px] fill-current text-mute/80">
            49152
          </text>

          {/* 悬停联动磁吸导线 (Two-Way Linkage Radial Guideline) */}
          {activeCoord && (
            <g>
              <line
                x1={center}
                y1={center}
                x2={activeCoord.x}
                y2={activeCoord.y}
                stroke="currentColor"
                strokeWidth="1.2"
                strokeDasharray="2 2"
                className="text-ink dark:text-white"
              />
              <motion.circle
                cx={activeCoord.x}
                cy={activeCoord.y}
                r="7"
                fill="none"
                stroke={
                  activePort?.level === 'danger'
                    ? '#C25B4E'
                    : activePort?.level === 'warn'
                      ? '#D97706'
                      : '#437A58'
                }
                strokeWidth="1.5"
                animate={{ r: [6, 13], opacity: [1, 0] }}
                transition={{ duration: 1.2, repeat: Infinity, ease: 'easeOut' }}
              />
            </g>
          )}

          {/* 端口散点映射与 8px 响应热区 */}
          {PORTS.map((item) => {
            const isLocal = item.bind === '127.0.0.1';
            const r = isLocal ? innerRadius : outerRadius;
            const angleRad = (getPortAngleDeg(item.port) * Math.PI) / 180;
            const x = center + r * Math.sin(angleRad);
            const y = center - r * Math.cos(angleRad);

            const isHovered = item.id === hoveredPortId;
            const color =
              item.level === 'danger'
                ? '#C25B4E'
                : item.level === 'warn'
                  ? '#D97706'
                  : '#437A58';

            return (
              <g
                key={item.id}
                onMouseEnter={() => onHoverPort(item.id)}
                onMouseLeave={() => onHoverPort(null)}
                className="cursor-pointer"
                data-testid={`radar-port-${item.port}`}
              >
                {/* 8px 点击与触碰响应热区 */}
                <circle cx={x} cy={y} r="8" fill="transparent" />
                <circle
                  cx={x}
                  cy={y}
                  r={isHovered ? 4.5 : 3}
                  fill={color}
                  stroke="#FFFFFF"
                  strokeWidth={isHovered ? 1.5 : 0.8}
                />
              </g>
            );
          })}
        </svg>

        {/* 极坐标中心锁定微点 */}
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#2B2A27] bg-[#2B2A27] dark:border-white dark:bg-white" />
      </div>

      {/* 极坐标同心轨道图例（0 碰撞、0 穿透，彻底消除字线重叠） */}
      <div className="mt-2.5 flex items-center justify-center gap-5 text-[10px] font-mono select-none">
        <div className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-full border border-[#C25B4E] bg-[#C25B4E]/20" />
          <span className="font-semibold text-ink dark:text-zinc-200">0.0.0.0</span>
          <span className="text-mute text-[9.5px]">(外轨 · PUBLIC 公网暴露)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-full border border-[#437A58] bg-[#437A58]/20" />
          <span className="font-semibold text-ink dark:text-zinc-200">127.0.0.1</span>
          <span className="text-mute text-[9.5px]">(内轨 · LOOPBACK 安全回环)</span>
        </div>
      </div>

      {/* 实时吸附遥测参数胶囊 */}
      <div className="mt-2 h-6 flex items-center justify-center text-[10.5px]">
        {activePort ? (
          <div className="flex items-center gap-1.5 rounded border border-[#2B2A27]/20 bg-ink/[0.04] px-2 py-0.5 dark:border-white/20 dark:bg-white/[0.05]">
            <span className="font-bold text-ink dark:text-white">
              :{activePort.port} ({activePort.proc})
            </span>
            <span className="text-mute">·</span>
            <span className="text-mute">PID {activePort.pid}</span>
            <span className="text-mute">·</span>
            <span
              className={cn(
                'font-semibold',
                activePort.level === 'danger'
                  ? 'text-[#C25B4E]'
                  : activePort.level === 'warn'
                    ? 'text-[#D97706]'
                    : 'text-[#437A58]',
              )}
            >
              [{activePort.riskLabel}]
            </span>
          </div>
        ) : (
          <span className="text-[10px] text-mute">悬停雷达散点或明细表查看暴露面属性</span>
        )}
      </div>
    </div>
  );
}

/**
 * 1px 细线端口暴露明细表 (Port Matrix Table)
 * 列：PORT / PROTO / PROCESS(PID) / BIND_ADDR / RISK_LEVEL
 * 弹性宽幅排版，进程名永不截断，双向聚焦联动
 */
export function SrePortMatrixTable({
  hoveredPortId,
  onHoverPort,
}: {
  hoveredPortId: string | null;
  onHoverPort: (id: string | null) => void;
}) {
  return (
    <div className="w-full flex-1 min-h-0 flex flex-col overflow-hidden font-mono text-[11px] text-ink dark:text-zinc-100">
      {/* 1px 细线表头，消除厚重外包框 */}
      <div className="flex items-center border-b border-[#2B2A27]/15 bg-subtle/80 px-3 py-1.5 text-[9.5px] font-semibold text-mute dark:border-white/15 dark:bg-white/[0.03]">
        <div className="w-16 shrink-0">PORT</div>
        <div className="w-14 shrink-0">PROTO</div>
        <div className="flex-1 min-w-[110px] pr-2">PROCESS (PID)</div>
        <div className="w-24 shrink-0">BIND_ADDR</div>
        <div className="w-28 shrink-0 text-right">RISK_LEVEL</div>
      </div>

      {/* 滚动列表明细 */}
      <div className="flex-1 overflow-y-auto divide-y divide-[#2B2A27]/08 dark:divide-white/08">
        {PORTS.map((item) => {
          const isHovered = item.id === hoveredPortId;
          const isDanger = item.level === 'danger';
          const isWarn = item.level === 'warn';

          return (
            <div
              key={item.id}
              data-testid={`port-row-${item.port}`}
              onMouseEnter={() => onHoverPort(item.id)}
              onMouseLeave={() => onHoverPort(null)}
              className={cn(
                'flex items-center px-3 py-2 transition-colors cursor-pointer select-none text-[11px]',
                isHovered
                  ? 'bg-ink/[0.06] dark:bg-white/10 border-l-2 border-l-[#2B2A27] dark:border-l-white font-semibold'
                  : 'hover:bg-ink/[0.02] dark:hover:bg-white/[0.02] border-l-2 border-l-transparent',
              )}
            >
              <div className="w-16 shrink-0 font-bold tabular-nums text-ink dark:text-white">
                :{item.port}
              </div>
              <div className="w-14 shrink-0 text-mute text-[10px]">
                {item.proto}
              </div>
              <div className="flex-1 min-w-[110px] pr-2 text-ink dark:text-zinc-200 truncate">
                <span className="font-medium">{item.proc}</span>
                <span className="ml-1 text-[9.5px] text-mute">({item.pid})</span>
              </div>
              <div className="w-24 shrink-0 text-[10px] tabular-nums">
                <span
                  className={cn(
                    'rounded px-1.5 py-0.5 font-medium',
                    item.bind === '0.0.0.0'
                      ? 'bg-[#C25B4E]/10 text-[#C25B4E] dark:text-[#E07A6D]'
                      : 'text-mute dark:text-zinc-400',
                  )}
                >
                  {item.bind}
                </span>
              </div>
              <div className="w-28 shrink-0 flex justify-end">
                <span
                  className={cn(
                    'inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[9px] font-semibold tracking-tight',
                    isDanger
                      ? 'border-[#C25B4E]/40 text-[#C25B4E] bg-[#C25B4E]/05 dark:border-[#E07A6D]/40 dark:text-[#E07A6D]'
                      : isWarn
                        ? 'border-[#D97706]/40 text-[#D97706] bg-[#D97706]/05 dark:border-[#F59E0B]/40 dark:text-[#F59E0B]'
                        : 'border-[#437A58]/40 text-[#437A58] bg-[#437A58]/05 dark:border-[#67A880]/40 dark:text-[#67A880]',
                  )}
                >
                  {isDanger ? (
                    <ShieldAlert size={10} className="shrink-0" />
                  ) : (
                    <ShieldCheck size={10} className="shrink-0" />
                  )}
                  <span>{item.riskLabel}</span>
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * 完整网络拓扑与端口暴露面大盘视图 (Network Surface Dashboard)
 * 上半区 240px 极坐标雷达 + 下半区 1px 线框明细表，双向联动
 */
export function SreNetworkSurfaceView() {
  const [hoveredPortId, setHoveredPortId] = useState<string | null>(null);

  return (
    <div className="flex h-full w-full flex-col overflow-y-auto overflow-x-hidden p-4 font-mono">
      {/* 头部标题与图谱概览 */}
      <div className="flex shrink-0 items-center justify-between border-b border-[#2B2A27]/10 pb-3 dark:border-white/10">
        <div className="flex items-center gap-2 min-w-0">
          <Network size={15} className="text-ink dark:text-white shrink-0" />
          <span className="text-[12px] font-bold text-ink dark:text-white truncate">
            网络拓扑与端口暴露面大盘
          </span>
        </div>
        <span className="shrink-0 rounded border border-[#2B2A27]/20 bg-ink/[0.04] px-2 py-0.5 text-[10px] font-medium text-mute dark:border-white/20">
          7 PORTS ACTIVE
        </span>
      </div>

      {/* 上半区：240px 极坐标雷达 (居中，带精密刻度与无遮挡轨道标识) */}
      <div className="shrink-0 flex justify-center py-2">
        <SrePolarRadar240 hoveredPortId={hoveredPortId} onHoverPort={setHoveredPortId} />
      </div>

      {/* 下半区：1px 线框端口暴露明细表 */}
      <div className="flex-1 min-h-0 flex flex-col pt-2">
        <SrePortMatrixTable hoveredPortId={hoveredPortId} onHoverPort={setHoveredPortId} />
      </div>
    </div>
  );
}

/**
 * 顶栏极坐标微盘兼容组件（若仍有需要）
 */
export function SrePortRadarDial() {
  const [hoveredPortId, setHoveredPortId] = useState<string | null>(null);
  return <SrePolarRadar240 hoveredPortId={hoveredPortId} onHoverPort={setHoveredPortId} />;
}

/**
 * 核心任务四（P2级）：顶栏存储压力槽条与穿透微气泡 (GeometricTooltip)
 * 鼠标悬停在 DISK 槽条上时，向下浮出详细微卡片：
 * - / (btrfs): 22% used · 128G free · Inode: 14%
 * - /boot (ext4): 47% used · 480M free · Inode: 2%
 * - I/O Delta: Read 0 MB/s · Write 1.2 MB/s
 */
export function SreStorageGaugeStrip() {
  const rootUsage = 22;
  const bootUsage = 47;
  const isHigh = rootUsage > 80 || bootUsage > 80;

  return (
    <GeometricTooltip
      side="bottom"
      align="center"
      className="max-w-[340px]"
      label={
        <div className="space-y-1.5 py-0.5 text-left font-mono text-[10px]">
          <div className="flex items-center justify-between gap-3 text-ink dark:text-zinc-100">
            <span className="font-semibold">/ (btrfs):</span>
            <span className="font-mono text-[9.5px]">22% used · 128G free · Inode: 14%</span>
          </div>
          <div className="flex items-center justify-between gap-3 text-mute">
            <span className="font-semibold">/boot (ext4):</span>
            <span className="font-mono text-[9.5px]">47% used · 480M free · Inode: 2%</span>
          </div>
          <div className="border-t border-[#2B2A27]/10 pt-1 text-ink/80 dark:border-white/10 dark:text-zinc-300">
            <span>I/O Delta: Read 0 MB/s · Write 1.2 MB/s</span>
          </div>
        </div>
      }
    >
      <div
        className={cn(
          'flex items-center gap-2 rounded border border-[#2B2A27]/15 bg-canvas px-2.5 py-0.5 font-mono text-[10px] text-mute shadow-sm transition-colors cursor-pointer hover:border-[#2B2A27] dark:border-white/15 dark:bg-white/[0.02] dark:hover:border-white/40',
          isHigh && 'animate-bounce border-bad/50',
        )}
      >
        <HardDrive size={11} className="text-ink dark:text-white shrink-0" />
        <span className="font-semibold text-ink dark:text-zinc-200">DISK:</span>
        <div className="flex items-center gap-1.5">
          <span>/ {rootUsage}%</span>
          <div className="h-1.5 w-8 rounded-full bg-ink/10 dark:bg-white/10 overflow-hidden">
            <div className="h-full bg-[#437A58]" style={{ width: `${rootUsage}%` }} />
          </div>
          <span className="text-[#2B2A27]/20 dark:text-white/20">|</span>
          <span>/boot {bootUsage}% (r=47%)</span>
          <div className="h-1.5 w-8 rounded-full bg-ink/10 dark:bg-white/10 overflow-hidden">
            <div className="h-full bg-[#D97706]" style={{ width: `${bootUsage}%` }} />
          </div>
        </div>
      </div>
    </GeometricTooltip>
  );
}
