import { AnimatePresence, motion } from 'motion/react';
import { AlertOctagon, Check, ChevronDown, Server } from 'lucide-react';
import { useRef, useState } from 'react';
import { useCockpitStore, type FleetEnv } from '../../stores/useCockpitStore';
import { Tip } from '../ui/Tooltip';

interface FleetOption {
  key: FleetEnv;
  label: string;
  ip: string;
  desc: string;
  tag: string;
}

const FLEETS: FleetOption[] = [
  { key: 'local', label: 'LOCAL', ip: '127.0.0.1', desc: '本地 SRE 宿主机沙箱', tag: 'DEV' },
  { key: 'staging', label: 'STAGING', ip: '192.168.31.112', desc: '预发灰度验证节点', tag: 'TEST' },
  { key: 'prod', label: 'PROD', ip: '10.0.4.1', desc: '生产核心集群 (高危审计)', tag: 'CRITICAL' },
];

/**
 * SRE 智能作战指挥舱 · 目标主机环境切换菜单 (Target Fleet Switcher)
 */
export function SreFleetSwitcher() {
  const { fleet, setFleet } = useCockpitStore();
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLDivElement | null>(null);

  const current = FLEETS.find((f) => f.key === fleet) || FLEETS[0]!;

  return (
    <div ref={anchorRef} className="relative inline-block font-mono">
      <Tip label="切换目标主机与执行隔离环境">
        <button
          onClick={() => setOpen(!open)}
          aria-label="选择目标集群环境"
          className={`flex h-7 items-center gap-1.5 rounded border px-2 text-[10.5px] transition active:scale-95 ${
            fleet === 'prod'
              ? 'border-[#DC2626] bg-[#DC2626]/10 text-[#DC2626] font-bold dark:border-[#DC2626]'
              : 'border-[#2B2A27]/15 bg-canvas text-ink hover:border-[#2B2A27] dark:border-white/15 dark:text-zinc-200 dark:hover:border-white'
          }`}
        >
          <Server size={11} className="shrink-0" />
          <span>
            {current.label} · {current.ip}
          </span>
          <ChevronDown size={11} className="text-mute shrink-0" />
        </button>
      </Tip>

      {/* 几何下拉选项卡片 */}
      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-popover" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -4, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.98 }}
              transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
              className="absolute left-0 top-full z-popover mt-1 w-64 rounded-lg border border-[#2B2A27] bg-canvas p-1.5 text-ink shadow-float dark:border-white/30 dark:bg-[#18181B] dark:text-zinc-100"
            >
              <div className="border-b border-[#2B2A27]/10 px-2 py-1 text-[10px] text-mute">
                选择操作目标主机 Fleet
              </div>
              <div className="space-y-0.5 pt-1">
                {FLEETS.map((f) => {
                  const active = f.key === fleet;
                  return (
                    <button
                      key={f.key}
                      onClick={() => {
                        setFleet(f.key);
                        setOpen(false);
                      }}
                      className={`flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-[11px] transition ${
                        active
                          ? 'bg-ink/[0.06] font-semibold dark:bg-white/10'
                          : 'hover:bg-ink/[0.03] dark:hover:bg-white/[0.05]'
                      }`}
                    >
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1.5">
                          <span className={f.key === 'prod' ? 'text-[#DC2626] font-bold' : ''}>
                            {f.label} · {f.ip}
                          </span>
                        </div>
                        <span className="text-[9.5px] text-mute">{f.desc}</span>
                      </div>
                      {active && <Check size={12} className="text-ok shrink-0 ml-1" />}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * SRE 生产环境防护光晕 (Production Guard)
 * 母题 C：切入 PROD 时，一条 1px 朱红墨线沿视口边缘瞬间闭合，四角浮现 1px 准星
 */
export function SreProductionGuardOverlay() {
  const { fleet } = useCockpitStore();
  const isProd = fleet === 'prod';

  if (!isProd) return null;

  return (
    <div
      aria-hidden="true"
      role="presentation"
      className="pointer-events-none fixed inset-0 z-[60] border-[1.5px] border-[#DC2626] shadow-[inset_0_0_20px_rgba(220,38,38,0.12)]"
    >
      {/* 视口四角 1px 红色工程直角标尺准星 */}
      <div className="absolute left-2 top-2 h-4 w-4 border-l-2 border-t-2 border-[#DC2626]" />
      <div className="absolute right-2 top-2 h-4 w-4 border-r-2 border-t-2 border-[#DC2626]" />
      <div className="absolute bottom-2 left-2 h-4 w-4 border-b-2 border-l-2 border-[#DC2626]" />
      <div className="absolute bottom-2 right-2 h-4 w-4 border-b-2 border-r-2 border-[#DC2626]" />

      {/* 顶部中央警示微标 */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 rounded-b border-x border-b border-[#DC2626] bg-[#DC2626] px-3 py-0.5 font-mono text-[10px] font-bold text-white shadow-sm flex items-center gap-1">
        <AlertOctagon size={11} />
        <span>PROD 生产环境警戒 · 所有写操作已锁定二次签名</span>
      </div>
    </div>
  );
}
