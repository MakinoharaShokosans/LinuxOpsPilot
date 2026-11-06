/**
 * 悬停气泡：自绘，替代浏览器原生 title。渲染到 body（z-tip，高于弹窗与下拉），
 * 悬停稍作停顿后出现、键盘聚焦立即出现，离开即消失；触屏设备不显示。
 */
import { AnimatePresence, motion } from 'motion/react';
import {
  cloneElement,
  isValidElement,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
  type Ref,
} from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../utils/text';
import { useAnchor, type Side } from './useAnchor';

const SHOW_DELAY_MS = 80;

/** 同一时刻只留一个气泡 */
let closeCurrent: (() => void) | null = null;

interface TipProps {
  label: ReactNode;
  /** 快捷键等次要信息，显示在标签右侧 */
  hint?: string;
  side?: Side;
  align?: 'start' | 'center' | 'end';
  disabled?: boolean;
  className?: string;
  children: ReactElement<Record<string, unknown>>;
}

function canHover(): boolean {
  return typeof window.matchMedia !== 'function' || window.matchMedia('(hover: hover)').matches;
}

function setRef<T>(ref: Ref<T> | undefined, value: T | null): void {
  if (typeof ref === 'function') ref(value);
  else if (ref) (ref as { current: T | null }).current = value;
}

export function Tip({
  label,
  hint,
  side = 'bottom',
  align = 'center',
  disabled,
  className,
  children,
}: TipProps) {
  const [open, setOpen] = useState(false);
  const anchor = useRef<HTMLElement | null>(null);
  const pop = useRef<HTMLDivElement | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const id = useId();
  const placement = useAnchor(open, anchor, pop, side, align);

  const hide = useCallback(() => {
    clearTimeout(timer.current);
    setOpen(false);
  }, []);

  const show = useCallback(
    (delay: number) => {
      clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        closeCurrent?.();
        closeCurrent = hide;
        setOpen(true);
      }, delay);
    },
    [hide],
  );

  useEffect(
    () => () => {
      clearTimeout(timer.current);
      if (closeCurrent === hide) closeCurrent = null;
    },
    [hide],
  );

  // 点击、滚动、按键都会让气泡失去意义
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && hide();
    window.addEventListener('keydown', onKey);
    window.addEventListener('scroll', hide, true);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('scroll', hide, true);
    };
  }, [open, hide]);

  if (!isValidElement(children) || disabled || !label) return children;
  const child = children as ReactElement<Record<string, unknown>>;
  const props = child.props;
  const childRef = props['ref'] as Ref<HTMLElement> | undefined; // React 19：ref 是普通属性
  const call = (name: string, e: unknown) =>
    (props[name] as ((e: unknown) => void) | undefined)?.(e);

  const currentSide = placement?.side ?? side;

  return (
    <>
      {cloneElement(child, {
        ref: (node: HTMLElement | null) => {
          anchor.current = node;
          setRef(childRef, node);
        },
        'aria-describedby': open ? id : props['aria-describedby'],
        onMouseEnter: (e: unknown) => {
          call('onMouseEnter', e);
          if (canHover()) show(SHOW_DELAY_MS);
        },
        onMouseLeave: (e: unknown) => {
          call('onMouseLeave', e);
          hide();
        },
        onFocus: (e: unknown) => {
          call('onFocus', e);
          if ((e as { target?: HTMLElement }).target?.matches?.(':focus-visible')) show(0);
        },
        onBlur: (e: unknown) => {
          call('onBlur', e);
          hide();
        },
        onPointerDown: (e: unknown) => {
          call('onPointerDown', e);
          hide();
        },
      })}
      {createPortal(
        <AnimatePresence>
          {open && (
            <motion.div
              ref={pop}
              id={id}
              role="tooltip"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: placement ? 1 : 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.08, ease: [0.16, 1, 0.3, 1] }}
              style={{
                position: 'fixed',
                top: placement?.top ?? 0,
                left: placement?.left ?? 0,
              }}
              className={cn(
                'pointer-events-none z-tip relative flex max-w-[280px] items-center gap-1.5 rounded-[3px] px-2 py-1',
                'bg-white text-[#1A1A1A] border border-[#2B2A27] shadow-[0_2px_8px_-2px_rgba(43,42,39,0.15)]',
                'font-mono text-[10px] leading-tight select-none',
                'dark:bg-[#18181A] dark:text-[#F4F4F5] dark:border-white/30 dark:shadow-[0_2px_8px_-2px_rgba(0,0,0,0.5)]',
                className,
              )}
            >
              <span className="min-w-0 break-words font-medium">{label}</span>
              {hint && (
                <kbd className="shrink-0 rounded-[2px] border border-[#2B2A27]/20 bg-ink/[0.04] px-1 font-mono text-[9px] text-[#2B2A27]/80 dark:border-white/20 dark:bg-white/[0.06] dark:text-white/80">
                  {hint}
                </kbd>
              )}
              {/* Layer 3 4px 锐角微指示三角 */}
              {currentSide === 'bottom' && (
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 h-0 w-0 border-x-4 border-x-transparent border-b-4 border-b-[#2B2A27] dark:border-b-white/30" />
              )}
              {currentSide === 'top' && (
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-0 w-0 border-x-4 border-x-transparent border-t-4 border-t-[#2B2A27] dark:border-t-white/30" />
              )}
              {currentSide === 'right' && (
                <div className="absolute -left-1 top-1/2 -translate-y-1/2 h-0 w-0 border-y-4 border-y-transparent border-r-4 border-r-[#2B2A27] dark:border-r-white/30" />
              )}
              {currentSide === 'left' && (
                <div className="absolute -right-1 top-1/2 -translate-y-1/2 h-0 w-0 border-y-4 border-y-transparent border-l-4 border-l-[#2B2A27] dark:border-l-white/30" />
              )}
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </>
  );
}

/** omoi-aesthetic Layer 3 几何工程微气泡别名 */
export const GeometricTooltip = Tip;
