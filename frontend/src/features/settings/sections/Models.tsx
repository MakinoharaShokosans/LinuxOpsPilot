import { useQuery } from '@tanstack/react-query';
import { api } from '../../../api/endpoints';
import { formatTokens } from '../../../utils/text';
import { Group, Row } from '../parts';

interface ModelItem {
  tier: string;
  name: string;
  model: string;
  context_window: number;
}

const FALLBACK_MODELS: ModelItem[] = [
  { tier: 'reasoning', name: 'DeepSeek-R1', model: 'deepseek-reasoner', context_window: 128_000 },
  { tier: 'reasoning', name: 'Claude 3.5 Sonnet', model: 'claude-3-5-sonnet-20241022', context_window: 200_000 },
  { tier: 'reasoning', name: 'GPT-4o', model: 'gpt-4o-2024-08-06', context_window: 128_000 },
  { tier: 'fast', name: 'DeepSeek-V3', model: 'deepseek-chat', context_window: 128_000 },
  { tier: 'fast', name: 'Claude 3.5 Haiku', model: 'claude-3-5-haiku-20241022', context_window: 200_000 },
];

export function Models() {
  const models = useQuery({
    queryKey: ['models-raw'],
    queryFn: api.system.models,
    staleTime: Infinity,
  });

  const listData: ModelItem[] = (models.data && models.data.length > 0)
    ? models.data
    : FALLBACK_MODELS;

  const tiers = new Map<string, ModelItem[]>();
  for (const m of listData) {
    tiers.set(m.tier, [...(tiers.get(m.tier) ?? []), m]);
  }

  // 保证 reasoning 在前，fast 在后
  const orderedTiers = ['reasoning', 'fast', ...Array.from(tiers.keys()).filter((k) => k !== 'reasoning' && k !== 'fast')];

  return (
    <>
      {orderedTiers.map((tierKey) => {
        const list = tiers.get(tierKey);
        if (!list || list.length === 0) return null;
        const tierTitle =
          tierKey === 'reasoning'
            ? '推理模型层 (Reasoning Tier · 深度链式推演)'
            : tierKey === 'fast'
              ? '快速执行层 (Fast Tier · 轻量级高频决策)'
              : tierKey;

        return (
          <Group key={tierKey} title={tierTitle}>
            {list.map((m, i) => (
              <Row
                key={m.name}
                title={
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-[13px]">{m.name}</span>
                    <span className="font-mono text-[11px] text-mute">{m.model}</span>
                  </div>
                }
                note={`支持高阶 SRE 指令解析与上下文自主规划`}
              >
                <span className="inline-flex items-center rounded border border-ink/15 dark:border-white/20 bg-ink/[0.04] dark:bg-white/[0.05] px-1.5 py-0.5 font-mono text-[10.5px] font-medium tabular-nums text-ink dark:text-white">
                  {formatTokens(m.context_window)}
                </span>
                <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded border border-[#2B2A27]/20 dark:border-white/20 font-mono text-[10px] font-semibold text-mute">
                  #{i + 1}
                </span>
              </Row>
            ))}
          </Group>
        );
      })}
      {models.isError && (
        <p className="mt-2 text-xs font-mono text-bad">{(models.error as Error).message}</p>
      )}
    </>
  );
}
