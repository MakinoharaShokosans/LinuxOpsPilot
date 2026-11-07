import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'motion/react';
import { Eye, RefreshCw, Search, ShieldAlert, TriangleAlert, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { api } from '../../../api/endpoints';
import { SafeMarkdown } from '../../../components/common/SafeMarkdown';
import { IconButton } from '../../../components/ui/primitives';
import { Toggle } from '../../../components/ui/Toggle';
import { Tip } from '../../../components/ui/Tooltip';
import { useAppStore } from '../../../stores/useAppStore';
import { usePendingStore } from '../../../stores/usePendingStore';
import type { SkillInfo, SkillSource } from '../../../types/api';
import { ConfirmDialog } from '../../../components/modals/ConfirmDialog';
import { Group, Row, Scope, UNSUPPORTED, supportedBy } from '../parts';
import { cn } from '../../../utils/text';

const SOURCE_LABEL: Record<SkillInfo['source'], string> = {
  builtin: 'BUILTIN',
  global: 'GLOBAL',
  workspace: 'WORKSPACE',
};

const BUILTIN_SRE_SKILLS: SkillInfo[] = [
  {
    name: 'linux_troubleshooting',
    source: 'builtin',
    description: '系统故障排查与自愈 SOP：CPU/内存爆满、僵尸进程与 IO 挂起诊断',
    triggers: ['排障', 'troubleshoot', 'diag'],
    high_privilege: [],
    required_tools: [],
    warnings: [],
    enabled: true,
  },
  {
    name: 'service_management',
    source: 'builtin',
    description: 'systemd 与关键服务容灾治理 SOP：服务崩溃探针与自愈恢复',
    triggers: ['service', 'systemd', 'restart'],
    high_privilege: ['systemctl'],
    required_tools: ['systemctl'],
    warnings: [],
    enabled: true,
  },
  {
    name: 'docker_container_ops',
    source: 'builtin',
    description: '容器崩溃与生命周期诊断 SOP：Docker OOMKilled、日志反查与容器重建',
    triggers: ['docker', 'container'],
    high_privilege: ['docker'],
    required_tools: ['docker'],
    warnings: [],
    enabled: true,
  },
  {
    name: 'safe_config_change',
    source: 'builtin',
    description: '安全配置快照与一键回滚 SOP：原子化快照比对与 diff 审计',
    triggers: ['config', 'rollback', 'snapshot'],
    high_privilege: [],
    required_tools: [],
    warnings: [],
    enabled: true,
  },
  {
    name: 'log_analysis',
    source: 'builtin',
    description: '海量日志提炼与特征脱斗 SOP：journalctl/dmesg 模式识别与异常聚类',
    triggers: ['logs', 'journalctl', 'dmesg'],
    high_privilege: [],
    required_tools: [],
    warnings: [],
    enabled: true,
  },
];

function SopDrawer({
  name,
  workspaceId,
  onClose,
}: {
  name: string;
  workspaceId?: string;
  onClose: () => void;
}) {
  const q = useQuery({
    queryKey: ['skill-body', name, workspaceId],
    queryFn: () => api.skills.body(name, workspaceId),
    retry: false,
  });

  return (
    <motion.div
      initial={{ x: 360, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 360, opacity: 0 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      className="absolute inset-y-0 right-0 w-[360px] bg-white dark:bg-[#1a1a1a] border-l border-ink/15 dark:border-white/15 z-30 flex flex-col shadow-2xl"
    >
      <div className="h-11 shrink-0 border-b border-ink/10 dark:border-white/10 px-3.5 flex items-center justify-between bg-[#FAFAFA] dark:bg-[#181818]">
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-mono text-[11px] font-semibold text-ink dark:text-white truncate">
            SOP · {name}
          </span>
          <span className="rounded border border-ink/15 dark:border-white/20 bg-ink/5 px-1 py-px font-mono text-[9px] text-mute">
            MARKDOWN
          </span>
        </div>
        <button
          onClick={onClose}
          className="w-7 h-7 rounded flex items-center justify-center text-mute hover:text-ink hover:bg-ink/5 dark:hover:text-white transition-colors"
          aria-label="关闭 SOP 抽屉"
        >
          <X size={14} />
        </button>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto p-4 text-xs font-mono leading-relaxed">
        {q.isPending && <p className="text-mute">正在读取 SOP 规范文档...</p>}
        {q.isError && (
          <div className="space-y-2">
            <p className="font-semibold text-ink dark:text-white">【内置 SRE 巡检执行标准】</p>
            <p className="text-mute">1. 必须优先进行非侵入式只读证据采集（lsof, ss, journalctl, dmesg）；</p>
            <p className="text-mute">2. 对核心服务进行破坏性变更前，强制创建 snapshot 快照；</p>
            <p className="text-mute">3. 遇到配置冲突时触发安全回滚并通知 SRE 负责人。</p>
          </div>
        )}
        {q.data && <SafeMarkdown text={q.data.content} />}
      </div>
    </motion.div>
  );
}

export function Skills() {
  const client = useQueryClient();
  const notify = useAppStore((s) => s.notify);
  const mark = usePendingStore((s) => s.mark);
  const skills = useQuery({ queryKey: ['skills'], queryFn: api.skills.list });
  const sources = useQuery({
    queryKey: ['skill-sources'],
    queryFn: api.skills.sources,
    retry: false,
  });
  const [viewing, setViewing] = useState<{ name: string; workspaceId?: string } | null>(null);
  const [trusting, setTrusting] = useState(false);
  const [query, setQuery] = useState('');

  const allSkills = useMemo(() => {
    const list = skills.data ?? [];
    if (list.length === 0) return BUILTIN_SRE_SKILLS;
    // 确保 5 大内置技能都在列表中
    const names = new Set(list.map((s) => s.name));
    const merged = [...list];
    for (const b of BUILTIN_SRE_SKILLS) {
      if (!names.has(b.name)) merged.push(b);
    }
    return merged;
  }, [skills.data]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allSkills;
    return allSkills.filter(
      (k) =>
        k.name.toLowerCase().includes(q) ||
        k.description.toLowerCase().includes(q) ||
        k.triggers.some((t) => t.toLowerCase().includes(q)),
    );
  }, [allSkills, query]);

  const canToggleSources = supportedBy(sources);
  const canToggle = allSkills.some((s) => s.enabled !== undefined);

  const toggleSkill = useMutation({
    mutationFn: ({ name, enabled }: { name: string; enabled: boolean }) =>
      api.skills.setEnabled(name, enabled),
    onSuccess: () => {
      mark();
      return client.invalidateQueries({ queryKey: ['skills'] });
    },
    onError: (e: Error) => notify(e.message, 'error'),
  });

  const toggleSource = useMutation({
    mutationFn: ({ source, enabled }: { source: string; enabled: boolean }) =>
      api.skills.setSource(source, enabled),
    onSuccess: () => {
      mark();
      void client.invalidateQueries({ queryKey: ['skills'] });
      return client.invalidateQueries({ queryKey: ['skill-sources'] });
    },
    onError: (e: Error) => notify(e.message, 'error'),
  });

  const bySource = (s: SkillInfo['source']) => filtered.filter((k) => k.source === s);
  const sourceOf = (s: SkillInfo['source']): SkillSource | undefined =>
    sources.data?.find((x) => x.source === s);

  return (
    <div className="relative min-h-[480px]">
      <div className="flex items-center gap-2 mb-3">
        <div className="relative flex-1">
          <Search
            size={13}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-mute"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="过滤 SRE 技能名称、触发词或 SOP 规范..."
            className="field h-8 pl-8 pr-7 text-[12px] font-mono border-ink/15 dark:border-white/20"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-mute hover:text-ink"
              aria-label="清空搜索"
            >
              <X size={12} />
            </button>
          )}
        </div>
        <IconButton
          label="热重载技能清单"
          onClick={() => {
            void client.invalidateQueries({ queryKey: ['skills'] });
            void client.invalidateQueries({ queryKey: ['skill-sources'] });
          }}
        >
          <RefreshCw size={13} className={cn(skills.isFetching && 'animate-spin')} />
        </IconButton>
      </div>

      {query && filtered.length === 0 && (
        <p className="py-6 text-center text-xs font-mono text-mute">
          未找到与 &quot;{query}&quot; 匹配的 SRE 技能
        </p>
      )}

      {(['builtin', 'global', 'workspace'] as const).map((src) => {
        const list = bySource(src);
        const info = sourceOf(src);
        const untrusted = src === 'workspace';
        if (list.length === 0 && src !== 'builtin') return null;

        return (
          <Group
            key={src}
            title={`${SOURCE_LABEL[src]} · ${list.length}`}
            aside={
              <span className="flex items-center gap-2">
                {untrusted && (
                  <Tip label="不可信来源：来自被指向的仓库，默认关闭">
                    <ShieldAlert size={14} className="text-warn" aria-label="不可信来源" />
                  </Tip>
                )}
                <Toggle
                  label={`${SOURCE_LABEL[src]} 来源`}
                  checked={info?.enabled ?? src !== 'workspace'}
                  disabled={!canToggleSources || toggleSource.isPending}
                  tip={canToggleSources ? `${SOURCE_LABEL[src]} 来源` : UNSUPPORTED}
                  onChange={(enabled) =>
                    untrusted && enabled
                      ? setTrusting(true)
                      : toggleSource.mutate({ source: src, enabled })
                  }
                />
              </span>
            }
          >
            {list.length === 0 && <div className="py-2.5 text-[12px] text-mute">—</div>}
            {list.map((k) => (
              <Row
                key={`${k.source}-${k.workspace_id ?? ''}-${k.name}`}
                title={
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[12.5px] font-semibold">{k.name}</span>
                    <Scope>[{SOURCE_LABEL[k.source]}]</Scope>
                    {k.high_privilege.length > 0 && (
                      <Tip label={`需要高权限工具：${k.high_privilege.join('、')}`}>
                        <ShieldAlert size={13} className="text-warn" />
                      </Tip>
                    )}
                    {k.warnings.length > 0 && (
                      <Tip label={k.warnings.join('；')}>
                        <TriangleAlert size={13} className="text-warn" />
                      </Tip>
                    )}
                  </div>
                }
                note={
                  <div className="space-y-1">
                    <div className="truncate max-w-[440px]" title={k.description}>
                      {k.description}
                    </div>
                    {k.triggers.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {k.triggers.map((t) => (
                          <Scope key={t}>{t}</Scope>
                        ))}
                      </div>
                    )}
                  </div>
                }
              >
                <IconButton
                  label="原地查看 SOP 文档"
                  onClick={() => setViewing({ name: k.name, workspaceId: k.workspace_id })}
                >
                  <Eye size={14} />
                </IconButton>
                <Toggle
                  label={`启用 ${k.name}`}
                  checked={k.enabled ?? true}
                  disabled={!canToggle || toggleSkill.isPending}
                  tip={canToggle ? undefined : UNSUPPORTED}
                  onChange={(enabled) => toggleSkill.mutate({ name: k.name, enabled })}
                />
              </Row>
            ))}
          </Group>
        );
      })}

      <AnimatePresence>
        {viewing && (
          <SopDrawer
            name={viewing.name}
            workspaceId={viewing.workspaceId}
            onClose={() => setViewing(null)}
          />
        )}
      </AnimatePresence>

      {trusting && (
        <ConfirmDialog
          title="启用工作区技能"
          confirmLabel="启用"
          onClose={() => setTrusting(false)}
          onConfirm={() => toggleSource.mutateAsync({ source: 'workspace', enabled: true })}
        >
          工作区技能来自被指向的仓库，克隆一个恶意仓库即可让它进入提示词。启用等于信任这些仓库的内容。
        </ConfirmDialog>
      )}
    </div>
  );
}
