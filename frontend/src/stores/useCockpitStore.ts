import { create } from 'zustand';
import type { PermissionLevel } from '../types/api';

export type FleetEnv = 'local' | 'staging' | 'prod';
export type TakeoverMode = 'autonomous' | 'human';
export type RightDrawerView = 'tasks' | 'artifacts' | 'network';

export interface TerminalLine {
  id: string;
  timestamp: string;
  text: string;
  type: 'system' | 'stdout' | 'stderr' | 'input';
}

export interface ArtifactDoc {
  open: boolean;
  title: string;
  content: string;
  path?: string;
  timestamp?: string;
}

interface CockpitState {
  // 1. 终端与人机接管
  terminalOpen: boolean;
  terminalHeight: number;
  takeoverMode: TakeoverMode;
  terminalLogs: TerminalLine[];
  setTerminalHeight: (height: number) => void;
  toggleTerminal: (open?: boolean) => void;
  setTakeoverMode: (mode: TakeoverMode) => void;
  addTerminalLog: (text: string, type?: TerminalLine['type']) => void;

  // 2. 交付产物与 Runbook
  activeArtifact: ArtifactDoc;
  openArtifact: (title: string, content: string, path?: string) => void;
  closeArtifact: () => void;

  // 3. SRE 全局权限安全基线与生产环境隔离 (会话级独立隔离)
  activeSessionId: string | null;
  setActiveSessionId: (sessionId: string | null) => void;
  sessionPermissions: Record<string, PermissionLevel>;
  setPermissionLevel: (level: PermissionLevel, sessionId?: string | null) => void;
  initSessionPermission: (sessionId: string, level: PermissionLevel) => void;
  getSessionPermission: (sessionId?: string | null) => PermissionLevel;
  permissionLevel: PermissionLevel;
  fleet: FleetEnv;
  setFleet: (fleet: FleetEnv) => void;

  // 4. 端口暴露面与存储雷达
  portRadarOpen: boolean;
  setPortRadarOpen: (open: boolean) => void;
  togglePortRadar: () => void;

  // 5. 右侧抽屉多视图切换 (Drawer View Switcher)
  rightDrawerView: RightDrawerView;
  setRightDrawerView: (view: RightDrawerView) => void;

  // 6. 抽屉宽度、宽屏全览与大纲 TOC 状态
  inspectorWide: boolean;
  setInspectorWide: (wide: boolean) => void;
  toggleInspectorWide: () => void;
  drawerWidths: Record<RightDrawerView, number>;
  setDrawerWidth: (view: RightDrawerView, width: number) => void;
  tocCollapsed: boolean;
  setTocCollapsed: (collapsed: boolean) => void;
  toggleToc: () => void;
}

const DEFAULT_ARTIFACT_CONTENT = `# 《系统全要素巡检与调优诊断大盘》
> 自动化巡检引擎执行完毕 · 节点: 127.0.0.1 · 耗时: 3.42s

## 1. 诊断总览与定性结论
- **总体状态**: [良性 · 整体受控]
- **核心判定**: 内核污染掩码 \`taint=12288\` 经按位分解，系宿主机官方 NVIDIA 专有闭源显卡驱动挂载引起，不影响计算稳定性；
- **I/O 压力**: \`IO pressure 86%\` 系历史 avg300 加权衰减迟滞，当前物理读写 0 MB/s / 1.2 MB/s，不存在硬件 I/O 堵塞；
- **网络规则**: 检测到 Docker \`FORWARD\` 链与 \`firewalld\` 规则存在冲突潜在风险。

## 2. 详细指标分析与佐证
- **系统工具基线**: \`/usr/bin/head\` 静态哈希匹配 GNU coreutils 8.32，属于合规良性程序；
- **信号量监控**: 曾捕捉到 \`SIGXFSZ\` (Signal 25) 告警，原因为局部日志写入未限制文件大小；
- **存储分配**: \`/\` 使用率 22%，\`/boot\` 使用率 47%，处于稳定阈值以内。

## 3. 待处置建议与编排指令 (P2)
1. 建议调整当前 Shell 文件写入配额:
   \`\`\`bash
   ulimit -f unlimited
   \`\`\`
2. 建议将 \`docker0\` 网桥纳入 firewalld trusted 区域消除丢包隐患:
   \`\`\`bash
   firewall-cmd --permanent --zone=trusted --add-interface=docker0
   firewall-cmd --reload
   \`\`\`

## 4. 安全取证与合规隔离
- 本次巡检严格遵循 \`AUDIT-ID: SEC-ENFORCED · READONLY\` 只读规范；
- 全程未对核心系统文件执行提权修改，未终止业务进程。
`;

const INITIAL_LOGS: TerminalLine[] = [
  {
    id: 'l-0',
    timestamp: '16:42:01',
    text: '[PTY] Sidecar pty-harness attached to tty0 (127.0.0.1:sre)',
    type: 'system',
  },
  {
    id: 'l-1',
    timestamp: '16:42:02',
    text: '$ uname -r && cat /proc/sys/kernel/tainted',
    type: 'input',
  },
  {
    id: 'l-2',
    timestamp: '16:42:02',
    text: '6.8.0-sre-generic\n12288',
    type: 'stdout',
  },
  {
    id: 'l-3',
    timestamp: '16:42:05',
    text: '$ cat /proc/pressure/io',
    type: 'input',
  },
  {
    id: 'l-4',
    timestamp: '16:42:05',
    text: 'some avg10=0.00 avg60=0.00 avg300=86.12 total=14981290\nfull avg10=0.00 avg60=0.00 avg300=0.00 total=0',
    type: 'stdout',
  },
];

const getInitialTerminalHeight = (): number => {
  if (typeof window === 'undefined') return 340;
  try {
    const saved = localStorage.getItem('linuxops_terminal_height');
    if (saved) {
      const parsed = parseInt(saved, 10);
      if (!isNaN(parsed) && parsed >= 200 && parsed <= 1200) {
        return parsed;
      }
    }
    return Math.max(260, Math.min(600, Math.round(window.innerHeight * 0.4)));
  } catch {
    return 340;
  }
};

const loadInitialSessionPermissions = (): Record<string, PermissionLevel> => {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem('linuxops_session_permissions');
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      return parsed as Record<string, PermissionLevel>;
    }
    return {};
  } catch {
    return {};
  }
};

const saveSessionPermissions = (permissions: Record<string, PermissionLevel>) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('linuxops_session_permissions', JSON.stringify(permissions));
  } catch {
    // ignore
  }
};

export const useCockpitStore = create<CockpitState>((set, get) => ({
  // 1. 终端
  terminalOpen: false,
  terminalHeight: getInitialTerminalHeight(),
  takeoverMode: 'autonomous',
  terminalLogs: INITIAL_LOGS,
  setTerminalHeight: (height) => {
    try {
      localStorage.setItem('linuxops_terminal_height', String(height));
    } catch {
      // ignore
    }
    set({ terminalHeight: height });
  },
  toggleTerminal: (open) =>
    set((s) => ({ terminalOpen: typeof open === 'boolean' ? open : !s.terminalOpen })),
  setTakeoverMode: (mode) => {
    const prev = get().takeoverMode;
    if (prev !== mode) {
      const now = new Date().toTimeString().split(' ')[0] ?? '00:00:00';
      const msg =
        mode === 'human'
          ? '>>> [HUMAN TAKEOVER] Agent loop suspended. Operator now in direct TTY control.'
          : '>>> [AGENT AUTONOMOUS] Operator relinquished control. Agent loop resumed.';
      set((s) => ({
        takeoverMode: mode,
        terminalLogs: [
          ...s.terminalLogs,
          { id: `l-${Date.now()}`, timestamp: now, text: msg, type: 'system' },
        ],
      }));
    }
  },
  addTerminalLog: (text, type = 'stdout') => {
    const now = new Date().toTimeString().split(' ')[0] ?? '00:00:00';
    set((s) => ({
      terminalLogs: [
        ...s.terminalLogs.slice(-200), // 保留最近 200 行
        { id: `l-${Date.now()}-${Math.random()}`, timestamp: now, text, type },
      ],
    }));
  },

  // 2. 交付产物
  activeArtifact: {
    open: false,
    title: '系统全要素巡检与调优诊断大盘.md',
    content: DEFAULT_ARTIFACT_CONTENT,
    path: '/var/log/linuxops/reports/inspection_latest.md',
    timestamp: '2026-11-06 16:42:10',
  },
  openArtifact: (title, content, path) =>
    set({
      rightDrawerView: 'artifacts',
      activeArtifact: {
        open: true,
        title,
        content: content || DEFAULT_ARTIFACT_CONTENT,
        path: path || '/var/log/linuxops/reports/inspection_latest.md',
        timestamp: new Date().toLocaleString(),
      },
    }),
  closeArtifact: () =>
    set((s) => ({
      activeArtifact: { ...s.activeArtifact, open: false },
    })),

  // 3. SRE 全局权限安全基线与生产环境隔离 (会话级独立隔离)
  activeSessionId: null,
  sessionPermissions: loadInitialSessionPermissions(),
  permissionLevel: 'workspace_write',
  fleet: 'staging',

  setActiveSessionId: (sessionId) => {
    const permissions = get().sessionPermissions;
    const currentSessionLevel = sessionId ? (permissions[sessionId] ?? 'workspace_write') : 'workspace_write';
    set({
      activeSessionId: sessionId,
      permissionLevel: currentSessionLevel,
      fleet:
        currentSessionLevel === 'full_permissions'
          ? 'prod'
          : currentSessionLevel === 'read_only'
            ? 'local'
            : 'staging',
    });
  },

  setPermissionLevel: (level, targetSessionId) => {
    const sid = targetSessionId ?? get().activeSessionId;
    const nextMap = sid ? { ...get().sessionPermissions, [sid]: level } : get().sessionPermissions;
    if (sid) {
      saveSessionPermissions(nextMap);
    }
    const isTargetActive = !sid || sid === get().activeSessionId;
    set({
      sessionPermissions: nextMap,
      ...(isTargetActive
        ? {
            permissionLevel: level,
            fleet: level === 'full_permissions' ? 'prod' : level === 'read_only' ? 'local' : 'staging',
          }
        : {}),
    });
  },

  initSessionPermission: (sessionId, level) => {
    const existing = get().sessionPermissions[sessionId];
    if (existing) return;
    const nextMap = { ...get().sessionPermissions, [sessionId]: level };
    saveSessionPermissions(nextMap);
    const isActive = get().activeSessionId === sessionId;
    set({
      sessionPermissions: nextMap,
      ...(isActive
        ? {
            permissionLevel: level,
            fleet:
              level === 'full_permissions'
                ? 'prod'
                : level === 'read_only'
                  ? 'local'
                  : 'staging',
          }
        : {}),
    });
  },

  getSessionPermission: (sessionId) => {
    const sid = sessionId ?? get().activeSessionId;
    if (sid) {
      const existing = get().sessionPermissions[sid];
      if (existing) return existing;
    }
    return get().permissionLevel ?? 'workspace_write';
  },

  setFleet: (fleet) => {
    const level: PermissionLevel =
      fleet === 'prod' ? 'full_permissions' : fleet === 'local' ? 'read_only' : 'workspace_write';
    get().setPermissionLevel(level);
  },

  // 4. 端口雷达
  portRadarOpen: false,
  setPortRadarOpen: (open) => set({ portRadarOpen: open, ...(open ? { rightDrawerView: 'network' as const } : {}) }),
  togglePortRadar: () =>
    set((s) => {
      const next = !s.portRadarOpen;
      return { portRadarOpen: next, ...(next ? { rightDrawerView: 'network' as const } : {}) };
    }),

  // 5. 右侧抽屉多视图切换
  rightDrawerView: 'tasks',
  setRightDrawerView: (view) => set({ rightDrawerView: view }),

  // 6. 抽屉宽度、宽屏全览与大纲 TOC 状态
  inspectorWide: false,
  setInspectorWide: (wide) => set({ inspectorWide: wide }),
  toggleInspectorWide: () => set((s) => ({ inspectorWide: !s.inspectorWide })),
  drawerWidths: {
    tasks: 380,
    artifacts: 760, // 宽适图纸阅读默认宽度，拒绝 450px 挤压排版
    network: 640,   // 大盘级网络暴露面视图默认宽度，确保表格进程列不被截断 (1...
  },
  setDrawerWidth: (view, width) =>
    set((s) => ({
      drawerWidths: {
        ...s.drawerWidths,
        [view]: width,
      },
    })),
  tocCollapsed: false,
  setTocCollapsed: (collapsed) => set({ tocCollapsed: collapsed }),
  toggleToc: () => set((s) => ({ tocCollapsed: !s.tocCollapsed })),
}));
