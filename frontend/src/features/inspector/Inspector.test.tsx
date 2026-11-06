import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useCockpitStore } from '../../stores/useCockpitStore';
import { Inspector } from './Inspector';

function renderWithClient(ui: React.ReactElement) {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

describe('Inspector Multi-Drawer Switcher', () => {
  beforeEach(() => {
    useCockpitStore.setState({
      rightDrawerView: 'tasks',
      activeArtifact: {
        open: true,
        title: '巡检报告.md',
        content: '# 标题一\n巡检内容',
        path: '/var/log/report.md',
      },
    });
  });

  it('renders segmented control tabs for tasks, artifacts, and network surface', () => {
    renderWithClient(<Inspector sessionId="s-1" />);
    const tasksTab = screen.getByRole('tab', { name: /任务与上下文/ });
    const artifactsTab = screen.getByRole('tab', { name: /交付报告/ });
    const networkTab = screen.getByRole('tab', { name: /端口暴露面/ });

    expect(tasksTab).toBeDefined();
    expect(artifactsTab).toBeDefined();
    expect(networkTab).toBeDefined();

    // Must be pure SVG icons with zero text content (icon-only 28x28 compact segmented tabs)
    expect(tasksTab.querySelector('svg')).not.toBeNull();
    expect(artifactsTab.querySelector('svg')).not.toBeNull();
    expect(networkTab.querySelector('svg')).not.toBeNull();
    expect(tasksTab.textContent).toBe('');
    expect(artifactsTab.textContent).toBe('');
    expect(networkTab.textContent).toBe('');
  });

  it('switches views smoothly when tabs are clicked', () => {
    renderWithClient(<Inspector sessionId="s-1" />);

    // Switch to artifacts tab
    const artifactTab = screen.getByRole('tab', { name: /交付报告/ });
    fireEvent.click(artifactTab);
    expect(useCockpitStore.getState().rightDrawerView).toBe('artifacts');
    expect(screen.getByText('巡检报告.md')).toBeDefined();
    expect(screen.getByRole('button', { name: '提取自愈 Playbook' })).toBeDefined();

    // Switch to network surface tab
    const networkTab = screen.getByRole('tab', { name: /端口暴露面/ });
    fireEvent.click(networkTab);
    expect(useCockpitStore.getState().rightDrawerView).toBe('network');
    expect(screen.getByText('网络拓扑与端口暴露面大盘')).toBeDefined();
    expect(screen.getByText('0 / 65535')).toBeDefined();

    // Switch back to tasks tab
    const tasksTab = screen.getByRole('tab', { name: /任务与上下文/ });
    fireEvent.click(tasksTab);
    expect(useCockpitStore.getState().rightDrawerView).toBe('tasks');
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn();
    renderWithClient(<Inspector sessionId="s-1" onClose={onClose} />);
    const closeBtn = screen.getByRole('button', { name: '关闭检视器' });
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalled();
  });

  it('toggles wide drawer mode when wide button is clicked', () => {
    useCockpitStore.setState({ inspectorWide: false });
    renderWithClient(<Inspector sessionId="s-1" />);

    const wideBtn = screen.getByRole('button', { name: '切换宽屏模式' });
    fireEvent.click(wideBtn);
    expect(useCockpitStore.getState().inspectorWide).toBe(true);

    const restoreBtn = screen.getByRole('button', { name: '恢复标准宽度' });
    fireEvent.click(restoreBtn);
    expect(useCockpitStore.getState().inspectorWide).toBe(false);
  });
});
