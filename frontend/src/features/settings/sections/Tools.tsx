import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Shield, Terminal } from 'lucide-react';
import { api } from '../../../api/endpoints';
import { Chevron, Reveal } from '../../../components/ui/primitives';
import { Group, Row, Scope } from '../parts';

interface ToolItem {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

const FALLBACK_TOOLS: ToolItem[] = [
  {
    name: 'bash',
    description: '在隔离子系统 Shell 环境中执行非交互式或有状态 Linux 运维指令',
    parameters: {
      type: 'object',
      properties: {
        command: { type: 'string', description: '要执行的 Bash 命令' },
        timeout: { type: 'number', description: '命令最大超时时间（秒）' },
      },
      required: ['command'],
    },
  },
  {
    name: 'read_file',
    description: '读取工作区或宿主系统指定路径的文本文件，支持分页与字节偏移行',
    parameters: {
      type: 'object',
      properties: {
        path: { type: 'string', description: '目标文件绝对路径' },
        start_line: { type: 'number', description: '起始行号' },
        end_line: { type: 'number', description: '结束行号' },
      },
      required: ['path'],
    },
  },
  {
    name: 'write_file',
    description: '在目标路径创建或覆写文本文件，支持自动递归创建父级目录',
    parameters: {
      type: 'object',
      properties: {
        path: { type: 'string', description: '目标文件绝对路径' },
        content: { type: 'string', description: '写入内容' },
        overwrite: { type: 'boolean', description: '是否强制覆写' },
      },
      required: ['path', 'content'],
    },
  },
  {
    name: 'edit_file',
    description: '基于精准文本片段比对执行原子化行内替换（Target ➔ Replacement）',
    parameters: {
      type: 'object',
      properties: {
        path: { type: 'string', description: '目标文件绝对路径' },
        target: { type: 'string', description: '被替换的目标原文片段' },
        replacement: { type: 'string', description: '替换后的新文本内容' },
      },
      required: ['path', 'target', 'replacement'],
    },
  },
  {
    name: 'note',
    description: '记录瞬时排障思路、线索笔记与环境临时状态至当前任务上下文',
    parameters: {
      type: 'object',
      properties: {
        content: { type: 'string', description: '笔记摘要' },
      },
      required: ['content'],
    },
  },
  {
    name: 'read_artifact',
    description: '读取 SRE 诊断巡检大盘产物内容（inspection.md, network_topology 等）',
    parameters: {
      type: 'object',
      properties: {
        name: { type: 'string', description: '产物标识文件名' },
      },
      required: ['name'],
    },
  },
  {
    name: 'update_plan',
    description: '原子化更新 SRE 排障阶段性 SOP 任务步骤清单与执行状态',
    parameters: {
      type: 'object',
      properties: {
        steps: { type: 'array', items: { type: 'string' }, description: 'SOP 执行规划步骤' },
      },
      required: ['steps'],
    },
  },
];

export function Tools() {
  const tools = useQuery({ queryKey: ['tools'], queryFn: api.system.tools });
  const [open, setOpen] = useState<string | null>(null);
  const [bashTimeout, setBashTimeout] = useState('120');
  const [spillThreshold, setSpillThreshold] = useState('2KB');

  const list: ToolItem[] = (tools.data && tools.data.length > 0)
    ? tools.data
    : FALLBACK_TOOLS;

  return (
    <>
      <Group title="执行安全与脱斗阈值">
        <Row
          title={
            <span className="flex items-center gap-1.5">
              <Terminal size={14} />
              单条 Bash 最大超时 (Timeout)
            </span>
          }
          note="防止死循环命令或交互式阻塞挂起 SRE 代理线程"
        >
          <div className="flex items-center gap-1.5 font-mono text-xs">
            <input
              type="number"
              value={bashTimeout}
              onChange={(e) => setBashTimeout(e.target.value)}
              className="field h-7 w-16 px-2 text-center text-xs font-mono border-ink/15 dark:border-white/20"
            />
            <span className="text-mute">秒</span>
          </div>
        </Row>
        <Row
          title={
            <span className="flex items-center gap-1.5">
              <Shield size={14} />
              输出自动脱斗落盘阈值 (Spill Threshold)
            </span>
          }
          note="超过设定大小的终端输出自动截断转存为物理产物，防止上下文爆炸"
        >
          <div className="inline-flex h-7 items-center rounded-md border border-[#2B2A27]/20 dark:border-white/20 bg-white dark:bg-[#181818] p-0.5">
            {['2KB', '4KB', '8KB'].map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => setSpillThreshold(val)}
                className={`h-5.5 px-2 rounded font-mono text-[11px] font-medium transition-colors ${
                  spillThreshold === val
                    ? 'bg-[#2B2A27] text-white dark:bg-white dark:text-[#121212]'
                    : 'text-mute hover:text-ink'
                }`}
              >
                {val}
              </button>
            ))}
          </div>
        </Row>
      </Group>

      <Group title={`内核内置原生工具 · ${list.length}`}>
        {list.map((t) => (
          <div key={t.name} className="py-2.5">
            <button
              aria-expanded={open === t.name}
              onClick={() => setOpen(open === t.name ? null : t.name)}
              className="flex w-full items-center gap-2 text-left group"
            >
              <span className="font-mono text-[12.5px] font-semibold text-ink dark:text-white group-hover:underline">
                {t.name}
              </span>
              <Scope>BUILTIN</Scope>
              <span className="min-w-0 flex-1 truncate text-[11.5px] text-mute">{t.description}</span>
              <Chevron open={open === t.name} size={12} />
            </button>
            <Reveal open={open === t.name}>
              <div className="mt-2 rounded border border-ink/10 dark:border-white/10 bg-[#FAFAFA] dark:bg-[#111111] p-3 font-mono text-[11px] leading-relaxed text-ink/90 dark:text-white/90">
                <div className="text-2xs text-mute mb-1 uppercase tracking-wider font-semibold">
                  JSON Schema 规范架构定义:
                </div>
                <pre className="overflow-x-auto max-h-56">
                  {JSON.stringify(t.parameters, null, 2)}
                </pre>
              </div>
            </Reveal>
          </div>
        ))}
        {tools.isError && <p className="py-3 text-xs font-mono text-bad">{(tools.error as Error).message}</p>}
      </Group>
    </>
  );
}
