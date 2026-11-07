import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { useCockpitStore } from '../../stores/useCockpitStore';
import {
  SreFleetSwitcher,
  SrePermissionGuard,
  SreProductionGuardOverlay,
} from './SreProductionGuard';

describe('SrePermissionGuard & SreProductionGuardOverlay', () => {
  beforeEach(() => {
    useCockpitStore.setState({ permissionLevel: 'workspace_write' });
  });

  it('renders capsule and switches between read_only, workspace_write, and full_permissions', () => {
    render(<SrePermissionGuard />);
    const button = screen.getByRole('button', { name: '选择SRE操作权限基线' });
    expect(button.textContent).toContain('工作区读写 · WORKSPACE');

    // Open dropdown menu
    fireEvent.click(button);
    expect(screen.getByText(/只读取证模式 \(READ-ONLY\)/)).toBeDefined();
    expect(screen.getByText('只读命令无感放行，锁定所有写操作，零系统风险')).toBeDefined();
    expect(screen.getByText(/工作区读写 \(WORKSPACE\)/)).toBeDefined();
    expect(screen.getByText('允许生成报表与临时脚本，宿主高危操作强制 HITL 审批')).toBeDefined();
    expect(screen.getByText(/高危系统提权 \(FULL PRIVILEGED\)/)).toBeDefined();
    expect(screen.getByText('允许 sudo 提权、系统配置变更与服务操作 (高危审计)')).toBeDefined();

    // Select FULL PRIVILEGED (系统提权)
    const privilegedOption = screen.getByText(/高危系统提权 \(FULL PRIVILEGED\)/);
    fireEvent.click(privilegedOption);
    expect(useCockpitStore.getState().permissionLevel).toBe('full_permissions');
    expect(button.textContent).toContain('系统提权 · PRIVILEGED');

    // Open dropdown again and select READ-ONLY
    fireEvent.click(button);
    const readOnlyOption = screen.getByText(/只读取证模式 \(READ-ONLY\)/);
    fireEvent.click(readOnlyOption);
    expect(useCockpitStore.getState().permissionLevel).toBe('read_only');
    expect(button.textContent).toContain('只读取证 · READ-ONLY');
  });

  it('provides backward compatibility alias SreFleetSwitcher', () => {
    render(<SreFleetSwitcher />);
    const button = screen.getByRole('button', { name: '选择SRE操作权限基线' });
    expect(button).toBeDefined();
  });

  it('activates perimeter red alert wire and warning banner only when full_permissions is active', () => {
    const { container, rerender } = render(<SreProductionGuardOverlay />);
    // Not rendered on workspace_write or read_only
    expect(container.firstChild).toBeNull();

    // Switch to full_permissions (高危系统提权)
    act(() => {
      useCockpitStore.setState({ permissionLevel: 'full_permissions' });
    });
    rerender(<SreProductionGuardOverlay />);

    expect(screen.getByText(/PRIVILEGED 系统提权警戒/)).toBeDefined();
    expect(container.querySelector('.border-\\[\\#DC2626\\]')).toBeDefined();

    // Switch back to read_only (平滑消散)
    act(() => {
      useCockpitStore.setState({ permissionLevel: 'read_only' });
    });
    rerender(<SreProductionGuardOverlay />);
    expect(container.querySelector('.border-\\[\\#DC2626\\]')).toBeNull();
  });

  it('isolates permission levels between different conversation sessions', () => {
    // 1. Session A is set to full_permissions
    useCockpitStore.getState().setActiveSessionId('session-a');
    render(<SrePermissionGuard sessionId="session-a" />);
    const button = screen.getByRole('button', { name: '选择SRE操作权限基线' });

    act(() => {
      fireEvent.click(button);
    });
    const privilegedOption = screen.getByText(/高危系统提权 \(FULL PRIVILEGED\)/);
    act(() => {
      fireEvent.click(privilegedOption);
    });

    expect(useCockpitStore.getState().sessionPermissions['session-a']).toBe('full_permissions');
    expect(useCockpitStore.getState().permissionLevel).toBe('full_permissions');

    // 2. Switch to Session B (which has no explicit setting, so it must safely default to workspace_write)
    act(() => {
      useCockpitStore.getState().setActiveSessionId('session-b');
    });
    expect(useCockpitStore.getState().permissionLevel).toBe('workspace_write');

    // 3. Set Session B to read_only
    act(() => {
      useCockpitStore.getState().setPermissionLevel('read_only', 'session-b');
    });
    expect(useCockpitStore.getState().sessionPermissions['session-b']).toBe('read_only');
    expect(useCockpitStore.getState().permissionLevel).toBe('read_only');

    // 4. Session A must strictly remain full_permissions!
    expect(useCockpitStore.getState().sessionPermissions['session-a']).toBe('full_permissions');

    // 5. Switching back to Session A must restore full_permissions
    act(() => {
      useCockpitStore.getState().setActiveSessionId('session-a');
    });
    expect(useCockpitStore.getState().permissionLevel).toBe('full_permissions');

    // 6. Switching back to Session B must restore read_only
    act(() => {
      useCockpitStore.getState().setActiveSessionId('session-b');
    });
    expect(useCockpitStore.getState().permissionLevel).toBe('read_only');
  });

  it('toggles SreProductionGuardOverlay when switching between privileged and unprivileged sessions', () => {
    useCockpitStore.getState().setPermissionLevel('full_permissions', 'session-privileged');
    useCockpitStore.getState().setPermissionLevel('workspace_write', 'session-normal');

    const { container, rerender } = render(<SreProductionGuardOverlay />);

    // In normal session: no overlay
    act(() => {
      useCockpitStore.getState().setActiveSessionId('session-normal');
    });
    rerender(<SreProductionGuardOverlay />);
    expect(container.firstChild).toBeNull();

    // Switch to privileged session: red alert overlay appears
    act(() => {
      useCockpitStore.getState().setActiveSessionId('session-privileged');
    });
    rerender(<SreProductionGuardOverlay />);
    expect(screen.getByText(/PRIVILEGED 系统提权警戒/)).toBeDefined();

    // Switch back to normal session: red alert overlay immediately clears
    act(() => {
      useCockpitStore.getState().setActiveSessionId('session-normal');
    });
    rerender(<SreProductionGuardOverlay />);
    expect(container.querySelector('.border-\\[\\#DC2626\\]')).toBeNull();
  });
});
