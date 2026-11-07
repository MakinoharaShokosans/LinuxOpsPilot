import { AnimatePresence, motion } from 'motion/react';
import { AlertOctagon, Check, ChevronDown, FilePen, ShieldCheck } from 'lucide-react';
import { useRef, useState } from 'react';
import { useCockpitStore } from '../../stores/useCockpitStore';
import type { PermissionLevel } from '../../types/api';
import { Tip } from '../ui/Tooltip';
import { cn } from '../../utils/text';

export interface SrePermissionConfig {
  key: PermissionLevel;
  shortLabel: string;
  capsuleLabel: string;
  modeLabel: string;
  desc: string;
  icon: typeof ShieldCheck;
  capsuleClass: string;
  dropdownBadgeClass: string;
  dropdownBadgeText: string;
  tooltipText: string;
}

export const PERMISSION_CONFIGS: Record<PermissionLevel, SrePermissionConfig> = {
  read_only: {
    key: 'read_only',
    shortLabel: 'READ-ONLY',
    capsuleLabel: '只读取证 · READ-ONLY',
    modeLabel: '只读取证模式',
    desc: '只读命令无感放行，锁定所有写操作，零系统风险',
    icon: ShieldCheck,
    capsuleClass:
      'border-[#437A58]/35 bg-[#437A58]/05 text-[#437A58] hover:border-[#437A58] dark:border-[#437A58]/50 dark:bg-[#437A58]/10 dark:text-[#67A880]',
    dropdownBadgeClass: 'border-[#437A58]/30 bg-[#437A58]/10 text-[#437A58] dark:text-[#67A880]',
    dropdownBadgeText: 'SAFE',
    tooltipText: 'SRE 权限安全基线：只读取证模式 (锁定所有写操作，零系统风险)',
  },
  workspace_write: {
    key: 'workspace_write',
    shortLabel: 'WORKSPACE',
    capsuleLabel: '工作区读写 · WORKSPACE',
    modeLabel: '工作区读写',
    desc: '允许生成报表与临时脚本，宿主高危操作强制 HITL 审批',
    icon: FilePen,
    capsuleClass:
      'border-[#2B2A27]/20 bg-canvas text-ink hover:border-[#2B2A27] dark:border-white/20 dark:bg-canvas dark:text-zinc-200 dark:hover:border-white',
    dropdownBadgeClass:
      'border-[#2B2A27]/20 bg-ink/[0.04] text-ink dark:border-white/20 dark:bg-white/[0.06] dark:text-zinc-200',
    dropdownBadgeText: 'DEFAULT',
    tooltipText: 'SRE 权限安全基线：工作区读写 (允许生成临时脚本与报表，宿主高危操作强制审批)',
  },
  full_permissions: {
    key: 'full_permissions',
    shortLabel: 'FULL PRIVILEGED',
    capsuleLabel: '系统提权 · PRIVILEGED',
    modeLabel: '高危系统提权',
    desc: '允许 sudo 提权、系统配置变更与服务操作 (高危审计)',
    icon: AlertOctagon,
    capsuleClass:
      'border-[#DC2626] bg-[#DC2626]/10 text-[#DC2626] font-bold hover:border-[#DC2626] dark:border-[#DC2626] dark:bg-[#DC2626]/15',
    dropdownBadgeClass: 'border-[#DC2626]/40 bg-[#DC2626]/10 text-[#DC2626] font-bold',
    dropdownBadgeText: 'CRITICAL',
    tooltipText: 'SRE 权限安全基线：系统提权 (允许 sudo 与系统配置变更，全屏警戒)',
  },
};

/**
 * SRE 智能作战指挥舱 · 顶栏权限安全基线组件 (SrePermissionGuard)
 * 纯矢量 SVG 状态徽标 + 几何微气泡 + 下拉 1px 线框权限矩阵
 * 支持按当前会话 (sessionId) 独立隔离权限状态
 */
export function SrePermissionGuard({ sessionId }: { sessionId?: string } = {}) {
  const activeSessionId = useCockpitStore((s) => s.activeSessionId);
  const currentSessionId = sessionId ?? activeSessionId;
  const sessionPermissions = useCockpitStore((s) => s.sessionPermissions);
  const globalLevel = useCockpitStore((s) => s.permissionLevel);
  const setPermissionLevel = useCockpitStore((s) => s.setPermissionLevel);

  const permissionLevel =
    (currentSessionId ? sessionPermissions[currentSessionId] : null) ?? globalLevel ?? 'workspace_write';
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLDivElement | null>(null);

  const current = PERMISSION_CONFIGS[permissionLevel] || PERMISSION_CONFIGS.workspace_write;
  const CurrentIcon = current.icon;

  return (
    <div ref={anchorRef} className="relative inline-block font-mono">
      <Tip label={current.tooltipText}>
        <button
          onClick={() => setOpen(!open)}
          aria-label="选择SRE操作权限基线"
          className={cn(
            'flex h-7 items-center gap-1.5 rounded border px-2.5 text-[10.5px] transition active:scale-95 select-none',
            current.capsuleClass,
          )}
        >
          <CurrentIcon size={12} className="shrink-0" />
          <span>{current.capsuleLabel}</span>
          <ChevronDown
            size={11}
            className={cn('text-mute shrink-0 transition-transform duration-150', open && 'rotate-180')}
          />
        </button>
      </Tip>

      {/* 几何下拉选项卡片 (Layer 3 气泡与 1px 细线几何容器) */}
      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-popover" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -4, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.98 }}
              transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
              className="absolute left-0 top-full z-popover mt-1.5 w-80 rounded-lg border border-[#2B2A27] bg-canvas p-1.5 text-ink shadow-float dark:border-white/30 dark:bg-[#18181B] dark:text-zinc-100"
            >
              <div className="border-b border-[#2B2A27]/10 px-2.5 py-1.5 text-[10px] font-semibold text-mute flex items-center justify-between">
                <span>SRE 操作权限基线 · 生产安全防护</span>
                <span className="font-mono text-[9px] uppercase tracking-wider text-ink/40 dark:text-white/40">
                  GUARD MATRIX
                </span>
              </div>
              <div className="space-y-1 pt-1.5">
                {(['read_only', 'workspace_write', 'full_permissions'] as PermissionLevel[]).map(
                  (key) => {
                    const item = PERMISSION_CONFIGS[key];
                    const active = item.key === permissionLevel;
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.key}
                        onClick={() => {
                          setPermissionLevel(item.key, currentSessionId);
                          setOpen(false);
                        }}
                        className={cn(
                          'flex w-full items-start justify-between rounded-md p-2 text-left transition select-none',
                          active
                            ? 'border border-[#2B2A27]/30 bg-ink/[0.05] dark:border-white/30 dark:bg-white/10'
                            : 'border border-transparent hover:border-[#2B2A27]/15 hover:bg-ink/[0.03] dark:hover:border-white/15 dark:hover:bg-white/[0.05]',
                        )}
                      >
                        <div className="flex items-start gap-2 min-w-0">
                          <Icon
                            size={14}
                            className={cn(
                              'shrink-0 mt-0.5',
                              item.key === 'full_permissions'
                                ? 'text-[#DC2626]'
                                : item.key === 'read_only'
                                  ? 'text-[#437A58] dark:text-[#67A880]'
                                  : 'text-ink dark:text-white',
                            )}
                          />
                          <div className="flex flex-col min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span
                                className={cn(
                                  'text-[11px] font-semibold',
                                  item.key === 'full_permissions' && 'text-[#DC2626]',
                                )}
                              >
                                {item.modeLabel} ({item.shortLabel})
                              </span>
                              <span
                                className={cn(
                                  'rounded px-1 py-0.2 text-[8.5px] font-bold border',
                                  item.dropdownBadgeClass,
                                )}
                              >
                                {item.dropdownBadgeText}
                              </span>
                            </div>
                            <span className="text-[10px] text-mute leading-normal mt-0.5">
                              {item.desc}
                            </span>
                          </div>
                        </div>
                        {active && <Check size={13} className="text-ok shrink-0 ml-1.5 mt-0.5" />}
                      </button>
                    );
                  },
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

/** 向后兼容别名，指代全新的 SRE 权限安全基线切换器 */
export const SreFleetSwitcher = SrePermissionGuard;

/**
 * SRE 生产环境防护光晕 (Production Guard)
 * 母题 C：切入 PRIVILEGED 系统提权模式时，一条 1px 朱红墨线沿视口边缘瞬间闭合，四角浮现 1px 准星
 * 切回只读或工作区读写模式时平滑消散
 */
export function SreProductionGuardOverlay() {
  const { permissionLevel } = useCockpitStore();
  const isPrivileged = permissionLevel === 'full_permissions';

  if (!isPrivileged) return null;

  return (
    <div
      aria-hidden="true"
      role="presentation"
      className="pointer-events-none fixed inset-0 z-[60] border-[1.5px] border-[#DC2626] shadow-[inset_0_0_20px_rgba(220,38,38,0.12)] transition-opacity duration-200"
    >
      {/* 视口四角 1px 红色工程直角标尺准星 */}
      <div className="absolute left-2 top-2 h-4 w-4 border-l-2 border-t-2 border-[#DC2626]" />
      <div className="absolute right-2 top-2 h-4 w-4 border-r-2 border-t-2 border-[#DC2626]" />
      <div className="absolute bottom-2 left-2 h-4 w-4 border-b-2 border-l-2 border-[#DC2626]" />
      <div className="absolute bottom-2 right-2 h-4 w-4 border-b-2 border-r-2 border-[#DC2626]" />

      {/* 顶部中央警示微标 */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 rounded-b border-x border-b border-[#DC2626] bg-[#DC2626] px-3 py-0.5 font-mono text-[10px] font-bold text-white shadow-sm flex items-center gap-1.5">
        <AlertOctagon size={11} />
        <span>PRIVILEGED 系统提权警戒 · 所有写操作已锁定二次签名</span>
      </div>
    </div>
  );
}
