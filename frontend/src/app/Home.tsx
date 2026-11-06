/** 根路径：回到最近使用的会话；没有会话时显示欢迎态并支持一键新建对话与快捷运维指令。 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Navigate, useNavigate } from '@tanstack/react-router';
import { Menu, Plus } from 'lucide-react';
import { api } from '../api/endpoints';
import { useSessions } from '../api/queries';
import { StarLogo } from '../components/common/BrandLogo';
import { IconButton } from '../components/ui/primitives';
import { SreQuickCards } from '../features/conversation/SreQuickCards';
import { useAppStore } from '../stores/useAppStore';
import { useUiStore } from '../stores/useUiStore';
import { lastLocation } from '../utils/lastLocation';

export function Home() {
  const sessions = useSessions();
  const phone = useUiStore((s) => s.phone);
  const setNavOpen = useUiStore((s) => s.setNavOpen);
  const navigate = useNavigate();
  const client = useQueryClient();
  const notify = useAppStore((s) => s.notify);

  const create = useMutation({
    mutationFn: () => api.sessions.create(),
    onSuccess: (session) => {
      void client.invalidateQueries({ queryKey: ['sessions'] });
      void navigate({ to: '/s/$sessionId', params: { sessionId: session.session_id } });
    },
    onError: (e: Error) => notify(e.message, 'error'),
  });

  const handleQuickAction = (promptText: string) => {
    create.mutate(undefined, {
      onSuccess: (session) => {
        try {
          window.localStorage.setItem(`linuxops.draft.${session.session_id}`, promptText);
        } catch {
          // localStorage disabled
        }
        void client.invalidateQueries({ queryKey: ['sessions'] });
        void navigate({ to: '/s/$sessionId', params: { sessionId: session.session_id } });
      },
    });
  };

  const list = Array.isArray(sessions.data) ? sessions.data : [];
  if (sessions.isPending) return null;

  const last = lastLocation();
  const target = (last?.sessionId ? list.find((s) => s.session_id === last.sessionId) : null) ?? list[0];
  if (target) {
    return (
      <Navigate
        to="/s/$sessionId"
        params={{ sessionId: target.session_id }}
        replace
      />
    );
  }

  return (
    <div className="flex h-full flex-col">
      {phone && (
        <header className="flex h-12 items-center px-3">
          <IconButton label="导航" onClick={() => setNavOpen(true)}>
            <Menu size={17} />
          </IconButton>
        </header>
      )}
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center gap-6 px-4 py-8 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-ink/[0.1] bg-ink/[0.03] text-ink backdrop-blur dark:border-white/[0.12] dark:bg-white/[0.04]">
          <StarLogo size={32} />
        </div>
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-ink">欢迎使用 LinuxOpsPilot</h2>
          <p className="mt-1 text-sm text-mute">
            面向 Linux 生产环境的 SRE 运维智能体。选择常用指令开始，或新建空白会话。
          </p>
        </div>
        <div className="w-full">
          <SreQuickCards onSelect={handleQuickAction} disabled={create.isPending} />
        </div>
        <button
          onClick={() => create.mutate()}
          disabled={create.isPending}
          className="flex items-center gap-2 rounded-lg border border-[#2B2A27]/25 bg-canvas px-4 py-2 text-sm font-medium text-ink shadow-sm transition hover:border-[#2B2A27] hover:bg-subtle active:scale-[0.98] disabled:opacity-50 dark:border-white/20 dark:bg-canvas dark:hover:border-white/50 dark:hover:bg-white/[0.04]"
        >
          <Plus size={16} /> 新建空白会话
        </button>
      </div>
    </div>
  );
}
