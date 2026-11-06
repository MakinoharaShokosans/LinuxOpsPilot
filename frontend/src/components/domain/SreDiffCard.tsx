import { Check, Copy, FileText, RotateCcw } from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';
import { diffLines, diffStats } from '../../utils/diff';
import { stripControl } from '../../utils/text';
import { Tip } from '../ui/Tooltip';

export interface SreDiffCardProps {
  path?: string;
  before: string;
  after: string;
  backupPath?: string;
  backupTs?: string;
  onRollback?: () => Promise<void> | void;
  className?: string;
}

/**
 * SRE 智能指挥舱 · 配置变更 Diff 卡片与原地一键回滚 (Change & Rollback Hub)
 * 母题 B：游标卡尺矩形画线与形变
 * 纯白底色、1px 细线边框、零文字抖动 32x32px 纯 SVG 旋转形变回滚按钮
 */
export function SreDiffCard({
  path = '/etc/sysctl.conf',
  before,
  after,
  backupPath,
  backupTs,
  onRollback,
  className = '',
}: SreDiffCardProps) {
  const [copied, setCopied] = useState(false);
  const [rollbackState, setRollbackState] = useState<'idle' | 'rolling' | 'success'>('idle');

  const lines = diffLines(before, after);
  const { added, removed } = diffStats(lines);

  const fallbackBackup = backupPath || `${path.split('/').pop() ?? 'config'}.bak.${Math.floor(Date.now() / 1000)}`;
  const displayBackupTs = backupTs || 'AUTO-SNAPSHOT';

  const handleCopy = () => {
    void navigator.clipboard?.writeText(after);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };

  const handleRollback = async () => {
    if (rollbackState !== 'idle') return;
    setRollbackState('rolling');
    try {
      if (onRollback) {
        await onRollback();
      } else {
        // 模拟 400ms 原地回滚阻尼
        await new Promise((r) => setTimeout(r, 400));
      }
      setRollbackState('success');
      setTimeout(() => {
        setRollbackState('idle');
      }, 800);
    } catch {
      setRollbackState('idle');
    }
  };

  return (
    <div
      className={`not-prose my-3 overflow-hidden rounded-lg border border-[#2B2A27]/20 bg-canvas text-ink shadow-sm dark:border-white/20 dark:text-zinc-100 ${className}`}
    >
      {/* 顶栏：游标卡尺式参数标注与纯 SVG 操作微按钮 */}
      <div className="flex h-10 items-center justify-between border-b border-[#2B2A27]/10 bg-subtle px-3 font-mono text-[11px] text-mute dark:border-white/10 dark:bg-white/[0.02]">
        <div className="flex items-center gap-2 truncate">
          <FileText size={13} className="text-ink dark:text-white shrink-0" />
          <span className="font-semibold text-ink dark:text-white truncate">PATH: {path}</span>
          <span className="text-[#2B2A27]/20 dark:text-white/20">|</span>
          <span className="hidden sm:inline text-[10.5px]">
            BACKUP: {fallbackBackup} ({displayBackupTs})
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* 行数增减微标 */}
          <div className="flex items-center gap-1 font-mono text-[11px] select-none">
            <span className="text-[#437A58] font-medium">+{added}</span>
            <span className="text-[#C25B4E] font-medium">-{removed}</span>
          </div>

          <div className="h-3 w-[1px] bg-[#2B2A27]/15 dark:bg-white/15" />

          {/* 复制变更按钮 (32x32 纯 SVG 容器) */}
          <Tip label={copied ? '已复制最新配置' : '复制变更后配置'}>
            <button
              onClick={handleCopy}
              aria-label="复制配置"
              className="flex h-7 w-7 items-center justify-center rounded border border-[#2B2A27]/15 bg-canvas transition-colors hover:border-[#2B2A27] hover:bg-ink/[0.04] active:scale-95 dark:border-white/15 dark:hover:border-white dark:hover:bg-white/10"
            >
              {copied ? <Check size={13} className="text-ok" /> : <Copy size={13} />}
            </button>
          </Tip>

          {/* 一键回滚按钮：32x32px 纯 SVG 容器，旋转 360° 后形变对勾，绝无中文字符拉伸抖动 */}
          <Tip
            label={
              rollbackState === 'rolling'
                ? '正在原子回滚...'
                : rollbackState === 'success'
                  ? '回滚完成'
                  : '原地一键回滚此配置'
            }
          >
            <button
              onClick={() => void handleRollback()}
              disabled={rollbackState !== 'idle'}
              aria-label="回滚配置"
              className="flex h-7 w-7 items-center justify-center rounded border border-[#2B2A27]/25 bg-canvas transition-all hover:border-[#2B2A27] hover:bg-ink/[0.04] active:scale-95 disabled:opacity-70 dark:border-white/25 dark:hover:border-white dark:hover:bg-white/10"
            >
              {rollbackState === 'idle' && (
                <RotateCcw size={13} className="text-ink/80 transition-transform dark:text-zinc-200" />
              )}
              {rollbackState === 'rolling' && (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1], repeat: Infinity }}
                  className="flex items-center justify-center"
                >
                  <RotateCcw size={13} className="text-[#D97706]" />
                </motion.div>
              )}
              {rollbackState === 'success' && (
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center justify-center"
                >
                  <Check size={14} className="text-[#437A58]" />
                </motion.div>
              )}
            </button>
          </Tip>
        </div>
      </div>

      {/* 代码 Diff 主体：拒绝大面积色块浸润！纯白底色，删除行首 1px 细红线，新增行首 1px 细绿线 */}
      <div className="max-h-80 overflow-y-auto font-mono text-[12px] leading-relaxed select-text">
        {lines.length === 0 ? (
          <div className="p-3 text-center text-mute font-mono text-[11px]">无差异变更</div>
        ) : (
          lines.map((l, i) => {
            const isAdd = l.kind === 'add';
            const isDel = l.kind === 'del';
            return (
              <div
                key={i}
                className={`flex whitespace-pre-wrap break-all px-3 py-0.5 transition-colors ${
                  isAdd
                    ? 'border-l-2 border-[#437A58] bg-[#437A58]/[0.05]'
                    : isDel
                      ? 'border-l-2 border-[#C25B4E] bg-[#C25B4E]/[0.05]'
                      : 'border-l-2 border-transparent'
                }`}
              >
                {/* 1px 符号标记 */}
                <span
                  className={`w-5 shrink-0 select-none font-bold ${
                    isAdd
                      ? 'text-[#437A58]'
                      : isDel
                        ? 'text-[#C25B4E]'
                        : 'text-mute/30'
                  }`}
                >
                  {isAdd ? '+' : isDel ? '-' : ' '}
                </span>
                {/* 代码正文 */}
                <span
                  className={`min-w-0 flex-1 font-mono ${
                    isAdd
                      ? 'text-ink dark:text-zinc-100 font-medium'
                      : isDel
                        ? 'text-[#C25B4E] line-through opacity-85'
                        : 'text-ink/80 dark:text-zinc-300'
                  }`}
                >
                  {stripControl(l.text) || ' '}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
