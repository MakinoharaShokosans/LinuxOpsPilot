import type { ReactNode } from 'react';
import { isUnsupported } from '../../api/endpoints';
import { cn } from '../../utils/text';

/** 一行设置：左侧名称与说明，右侧控件 */
export function Row({
  title,
  note,
  children,
  className,
}: {
  title: ReactNode;
  note?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex items-center gap-3 py-2.5', className)}>
      <div className="min-w-0 flex-1">
        <div className="text-[13px] font-medium text-ink dark:text-white">{title}</div>
        {note && <div className="mt-0.5 text-[11.5px] leading-snug text-mute">{note}</div>}
      </div>
      <div className="flex shrink-0 items-center gap-2">{children}</div>
    </div>
  );
}

export function Group({
  title,
  children,
  aside,
}: {
  title?: string;
  children: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <section className="mb-4">
      {(title || aside) && (
        <div className="mb-1.5 flex items-center px-1">
          <h2 className="font-mono text-[11px] font-semibold uppercase tracking-wider text-mute">
            {title}
          </h2>
          <span className="ml-auto">{aside}</span>
        </div>
      )}
      <div className="divide-y divide-ink/[0.08] rounded-lg border border-ink/[0.12] bg-white dark:divide-white/[0.08] dark:border-white/[0.12] dark:bg-[#181818] px-3.5 shadow-sm">
        {children}
      </div>
    </section>
  );
}

/** 作用域微标 */
export function Scope({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded border border-ink/15 dark:border-white/20 bg-ink/[0.04] dark:bg-white/[0.06] px-1.5 py-px font-mono text-[10px] font-medium text-mute">
      {children}
    </span>
  );
}

export const UNSUPPORTED = '后端未提供';

export function supportedBy(query: { isError: boolean; error: unknown }): boolean {
  return !(query.isError && isUnsupported(query.error));
}
