import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useCockpitStore } from '../../stores/useCockpitStore';
import { Composer } from './Composer';

function renderWithClient(ui: React.ReactElement) {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

describe('Composer Clean Bottom Bar & Global Permission Binding', () => {
  beforeEach(() => {
    useCockpitStore.setState({ permissionLevel: 'workspace_write' });
  });

  it('no longer renders the redundant bottom permission baseline dropdown', () => {
    renderWithClient(
      <Composer
        sessionId="s-1"
        workspaceId="ws-1"
        busy={false}
        contextPercent={35}
        contextTokens={11000}
        contextLimit={32000}
        onCancel={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );

    // Redundant Select dropdown must be completely eliminated from Composer bottom bar
    expect(screen.queryByLabelText('权限基线')).toBeNull();
    expect(screen.queryByText('选择权限基线')).toBeNull();

    // ModelPicker and ContextRing are present
    expect(screen.getByText('默认')).toBeDefined();
    expect(screen.getByText('35%')).toBeDefined();
    expect(screen.getByRole('button', { name: '发送' })).toBeDefined();
  });

  it('submits with global permissionLevel from useCockpitStore', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    useCockpitStore.setState({ permissionLevel: 'workspace_write' });

    renderWithClient(
      <Composer
        sessionId="s-1"
        workspaceId="ws-1"
        busy={false}
        contextPercent={null}
        contextTokens={null}
        contextLimit={null}
        onCancel={vi.fn()}
        onSubmit={onSubmit}
      />,
    );

    const input = screen.getByLabelText('消息');
    act(() => {
      fireEvent.change(input, { target: { value: 'uptime' } });
    });

    const sendBtn = screen.getByRole('button', { name: '发送' });
    await act(async () => {
      fireEvent.click(sendBtn);
    });

    expect(onSubmit).toHaveBeenCalledWith('uptime', 'workspace_write', false);
  });

  it('triggers confirmation modal when in full_permissions mode', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    useCockpitStore.setState({ permissionLevel: 'full_permissions' });

    renderWithClient(
      <Composer
        sessionId="s-1"
        workspaceId="ws-1"
        busy={false}
        contextPercent={null}
        contextTokens={null}
        contextLimit={null}
        onCancel={vi.fn()}
        onSubmit={onSubmit}
      />,
    );

    // Warning banner appears in Composer
    expect(screen.getByText(/高危系统提权模式/)).toBeDefined();

    const input = screen.getByLabelText('消息');
    act(() => {
      fireEvent.change(input, { target: { value: 'reboot' } });
    });

    const sendBtn = screen.getByRole('button', { name: '发送' });
    act(() => {
      fireEvent.click(sendBtn);
    });

    // Modal appears
    expect(screen.getByText(/以高危系统提权 \(PRIVILEGED\) 运行？/)).toBeDefined();
    expect(onSubmit).not.toHaveBeenCalled();

    // Confirm execution
    const confirmBtn = screen.getByRole('button', { name: '确认执行' });
    await act(async () => {
      fireEvent.click(confirmBtn);
    });

    expect(onSubmit).toHaveBeenCalledWith('reboot', 'full_permissions', true);
  });

  it('respects per-session permission isolation in Composer', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    // session s-1 is read_only, while another session s-2 is full_permissions
    useCockpitStore.getState().setPermissionLevel('read_only', 's-1');
    useCockpitStore.getState().setPermissionLevel('full_permissions', 's-2');

    renderWithClient(
      <Composer
        sessionId="s-1"
        workspaceId="ws-1"
        busy={false}
        contextPercent={null}
        contextTokens={null}
        contextLimit={null}
        onCancel={vi.fn()}
        onSubmit={onSubmit}
      />,
    );

    // Should NOT show critical warning banner for s-1
    expect(screen.queryByText(/高危系统提权模式/)).toBeNull();

    const input = screen.getByLabelText('消息');
    act(() => {
      fireEvent.change(input, { target: { value: 'df -h' } });
    });

    const sendBtn = screen.getByRole('button', { name: '发送' });
    await act(async () => {
      fireEvent.click(sendBtn);
    });

    // Submits with s-1's isolated permission level (read_only)
    expect(onSubmit).toHaveBeenCalledWith('df -h', 'read_only', false);
  });
});
