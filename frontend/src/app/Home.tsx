/** 根路径：回到最近使用的会话；没有会话时显示欢迎态并支持一键新建对话。 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Navigate, useNavigate } from '@tanstack/react-router';
import { MessageSquarePlus, Menu, Plus } from 'lucide-react';
import { api } from '../api/endpoints';
import { useSessions } from '../api/queries';
import { IconButton } from '../components/ui/primitives';
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
      <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/10 text-accent">
          <MessageSquarePlus size={32} />
        </div>
        <div>
          <h2 className="text-base font-semibold text-ink">欢迎使用 LinuxOpsPilot</h2>
          <p className="mt-1 text-sm text-mute">暂无会话，立即开始第一个运维任务</p>
        </div>
        <button
          onClick={() => create.mutate()}
          disabled={create.isPending}
          className="flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-sm font-medium text-white transition hover:bg-accent/90 disabled:opacity-50"
        >
          <Plus size={16} /> 新建对话
        </button>
      </div>
    </div>
  );
}
