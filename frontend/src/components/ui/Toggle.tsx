/**
 * SRE 纯物理高反差微拨动开关 (The Geometric Toggle) 与工程分段选择器 (Segmented Switcher)
 * 严格遵循 omoi-aesthetic: 纯白/深墨高反差，1px 几何细线，零文字抖动，工程阻尼。
 */
import { motion } from 'motion/react';
import type { ReactNode } from 'react';
import { cn } from '../../utils/text';
import { Tip } from './Tooltip';

export function Toggle({
  checked,
  onChange,
  label,
  disabled,
  tip,
  className,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
  disabled?: boolean;
  /** 悬停气泡；默认用 label */
  tip?: ReactNode;
  className?: string;
}) {
  return (
    <Tip label={tip ?? label}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        aria-disabled={disabled || undefined}
        onClick={() => {
          if (!disabled) onChange(!checked);
        }}
        className={cn(
          'relative inline-flex h-[18px] w-[32px] shrink-0 items-center rounded-[9px] border transition-colors duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ink/30',
          checked
            ? 'bg-[#2B2A27] border-[#2B2A27] dark:bg-white dark:border-white'
            : 'bg-white border-[#E5E5E5] hover:border-ink/30 dark:bg-[#1a1a1a] dark:border-white/20 dark:hover:border-white/40',
          // 不用原生 disabled：保留悬停气泡与键盘焦点
          'aria-disabled:cursor-not-allowed aria-disabled:opacity-40',
          className,
        )}
      >
        <span
          className={cn(
            'block h-[12px] w-[12px] rounded-full transition-transform duration-150 ease-[cubic-bezier(0.16,1,0.3,1)]',
            checked
              ? 'translate-x-[16px] bg-white dark:bg-[#121212]'
              : 'translate-x-[2px] bg-[#8C8C8C] dark:bg-white/60',
          )}
        />
      </button>
    </Tip>
  );
}

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
  icon?: ReactNode;
}

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  label,
  className,
}: {
  value: T;
  onChange: (value: T) => void;
  options: SegmentOption<T>[];
  label: string;
  className?: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn(
        'inline-flex h-[28px] items-center rounded-md border border-[#2B2A27]/20 bg-white p-0.5 dark:border-white/20 dark:bg-[#181818]',
        className,
      )}
    >
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(o.value)}
            className={cn(
              'relative inline-flex h-[22px] items-center justify-center gap-1.5 rounded-[4px] px-2.5 font-mono text-[11px] font-medium transition-colors duration-150',
              on
                ? 'bg-[#2B2A27] text-white dark:bg-white dark:text-[#121212] shadow-sm'
                : 'text-mute hover:text-ink dark:hover:text-white',
            )}
          >
            {on && (
              <motion.span
                layoutId={`seg-${label}`}
                className="absolute inset-0 rounded-[4px] bg-[#2B2A27] dark:bg-white -z-0"
                transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5 shrink-0">
              {o.icon}
              {o.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
