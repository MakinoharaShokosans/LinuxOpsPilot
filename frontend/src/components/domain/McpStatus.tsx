/** 顶栏的 MCP 状态点：只报“几台在线”，管理入口在设置 → MCP。 */
import { useQuery } from '@tanstack/react-query';
import { Plug } from 'lucide-react';
import { api } from '../../api/endpoints';
import { Tip } from '../../components/ui/Tooltip';
import { useUiStore } from '../../stores/useUiStore';
import { cn } from '../../utils/text';

export function McpStatus() {
  const servers = useQuery({
    queryKey: ['mcp-servers'],
    queryFn: api.mcp.servers,
    refetchInterval: 20_000,
    retry: false,
    staleTime: 10_000,
  });
  const list = servers.data ?? [];
  if (!list.length) return null;
  const online = list.filter((s) => s.status === 'connected').length;
  const failed = list.some((s) => s.status === 'failed');
  return (
    <Tip label={`MCP ${online}/${list.length} 在线 · 点击配置`} side="bottom" align="end">
      <button
        type="button"
        aria-label={`MCP ${online}/${list.length} 在线`}
        onClick={() => {
          useUiStore.getState().setSettingsOpen(true, 'mcp');
        }}
        className={cn(
          'flex h-8 items-center gap-1.5 rounded-lg px-2 text-[11.5px] font-semibold tabular-nums transition-colors',
          'text-mute hover:bg-ink/[0.07] hover:text-ink',
          failed && 'text-bad/90 hover:text-bad',
        )}
      >
        <Plug size={14} className={failed ? 'text-bad' : online ? 'text-ok' : undefined} />
        <span className="hidden sm:inline">
          {online}/{list.length}
        </span>
      </button>
    </Tip>
  );
}
