import { Activity, Boxes, HardDrive, Network } from 'lucide-react';

export interface SreQuickAction {
  id: string;
  title: string;
  description: string;
  prompt: string;
  icon: typeof Activity;
  badge: string;
}

export const SRE_QUICK_ACTIONS: SreQuickAction[] = [
  {
    id: 'health_check',
    title: '系统健康度巡检',
    description: '检查 CPU 负载、内存 Swap、各磁盘挂载点容量与 Inode、僵尸进程与大负荷进程',
    prompt:
      '请执行系统健康度巡检：全面检查主机 CPU 负载（uptime）、内存使用量与 Swap（free -m）、各分区磁盘与 Inode 容量（df -h, df -i），以及高消耗与僵尸进程。',
    icon: Activity,
    badge: '基础体检',
  },
  {
    id: 'docker_triage',
    title: 'Docker 崩溃容器诊断',
    description: '定位 Exited/CrashLoop 状态容器，分析 ExitCode 与 OOM 并提取崩溃日志',
    prompt:
      '请排查当前主机上的 Docker 容器状态：识别所有异常停止或重启的容器，分析其退出码与 OOM 状态，并提取最近 50 行崩溃日志进行根因诊断。',
    icon: Boxes,
    badge: '容器运维',
  },
  {
    id: 'port_audit',
    title: '监听端口与连接审计',
    description: '审计所有 TCP/UDP 监听套接字、绑定进程 PID 与当前高并发连接状态',
    prompt:
      '请执行网络端口与连接审计：使用 ss -tulpn 列出所有正在监听的服务端口与进程 PID，排查异常开放端口，并检查 TCP 连接摘要（ss -s）。',
    icon: Network,
    badge: '网络连接',
  },
  {
    id: 'disk_cleanup',
    title: '磁盘空间清理排查',
    description: '定位占用前十的大目录/日志，排查 lsof +L1 被删除但未释放的文件句柄',
    prompt:
      '请排查磁盘空间与大文件占用：扫描占用最大的前 10 个目录与大日志文件，并使用 lsof +L1 检查是否存在已被删除但仍被进程持有导致未释放空间的句柄。',
    icon: HardDrive,
    badge: '存储调优',
  },
];

export function SreQuickCards({
  onSelect,
  disabled = false,
}: {
  onSelect: (prompt: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="w-full">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {SRE_QUICK_ACTIONS.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.id}
              disabled={disabled}
              onClick={() => onSelect(action.prompt)}
              className="group relative flex flex-col items-start gap-2 rounded-2xl border border-ink/[0.07] bg-card/60 p-4 text-left transition-all hover:border-accent/40 hover:bg-raised hover:shadow-card active:scale-[0.99] disabled:opacity-50 dark:border-white/[0.07] dark:bg-card/40 dark:hover:border-accent/50 dark:hover:bg-white/[0.04]"
            >
              <div className="flex w-full items-center justify-between">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent/10 text-accent transition-colors group-hover:bg-accent group-hover:text-white">
                  <Icon size={16} />
                </div>
                <span className="rounded-full bg-ink/[0.04] px-2 py-0.5 text-2xs font-medium text-mute dark:bg-white/[0.06]">
                  {action.badge}
                </span>
              </div>
              <div>
                <h3 className="text-[13.5px] font-semibold text-ink group-hover:text-accent">
                  {action.title}
                </h3>
                <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-mute">
                  {action.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
