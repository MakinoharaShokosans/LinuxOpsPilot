import type { SVGProps } from 'react';
import { cn } from '../../utils/text';

/** 高精度 SRE 工业建筑图纸十字准星与罗盘矢量标 */
export function StarLogo({
  size = 20,
  className,
  ...rest
}: { size?: number; className?: string } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={cn('shrink-0 text-ink dark:text-white', className)}
      {...rest}
    >
      {/* 建筑图纸基准辅助准星细线 */}
      <line x1="12" y1="1" x2="12" y2="4" stroke="currentColor" strokeWidth="1" strokeOpacity="0.4" />
      <line x1="12" y1="20" x2="12" y2="23" stroke="currentColor" strokeWidth="1" strokeOpacity="0.4" />
      <line x1="1" y1="12" x2="4" y2="12" stroke="currentColor" strokeWidth="1" strokeOpacity="0.4" />
      <line x1="20" y1="12" x2="23" y2="12" stroke="currentColor" strokeWidth="1" strokeOpacity="0.4" />

      {/* 几何四芒精密切削主体 */}
      <path
        d="M12 3 C12.5 7.8 16.2 11.5 21 12 C16.2 12.5 12.5 16.2 12 21 C11.5 16.2 7.8 12.5 3 12 C7.8 11.5 11.5 7.8 12 3 Z"
        fill="currentColor"
        className="opacity-95"
      />
      {/* 核心工程微孔/准星点 */}
      <circle cx="12" cy="12" r="1.5" fill="#FFFFFF" className="dark:fill-[#151517]" />
      {/* 右上角 1px 细线微型定位星标 */}
      <path
        d="M19 4 C19.2 5.2 20 6 21.2 6.2 C20 6.4 19.2 7.2 19 8.4 C18.8 7.2 18 6.4 16.8 6.2 C18 6 18.8 5.2 19 4 Z"
        fill="#2E7D32"
        className="dark:fill-emerald-400"
      />
    </svg>
  );
}

export function BrandBadge({
  collapsed = false,
  className,
}: {
  collapsed?: boolean;
  className?: string;
}) {
  return (
    <div className={cn('flex items-center gap-2 select-none', className)}>
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-ink/[0.1] bg-ink/[0.03] p-1 shadow-sm backdrop-blur dark:border-white/[0.12] dark:bg-white/[0.04]">
        <StarLogo size={16} />
      </div>
      {!collapsed && (
        <span className="font-semibold tracking-tight text-[13.5px] text-ink">
          Linux<span className="font-mono text-xs font-medium text-mute ml-0.5">OpsPilot</span>
        </span>
      )}
    </div>
  );
}
