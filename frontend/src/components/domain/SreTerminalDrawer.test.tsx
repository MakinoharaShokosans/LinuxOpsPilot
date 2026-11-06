import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { useCockpitStore } from '../../stores/useCockpitStore';
import { SreTerminalDrawer } from './SreTerminalDrawer';

describe('SreTerminalDrawer', () => {
  beforeEach(() => {
    useCockpitStore.setState({
      terminalOpen: true,
      takeoverMode: 'autonomous',
      terminalLogs: [
        { id: '1', timestamp: '12:00:00', text: '[PTY] Harness online', type: 'system' },
      ],
    });
  });

  it('renders PTY terminal output and oscilloscope wave indicator', () => {
    const { container } = render(<SreTerminalDrawer />);
    expect(screen.getByText('PTY TTY0 / LIVE HARNESS')).toBeDefined();
    expect(screen.getByText('[PTY] Harness online')).toBeDefined();
    expect(container.querySelector('svg path')).toBeDefined();
  });

  it('toggles between autonomous mode and human takeover mode', () => {
    render(<SreTerminalDrawer />);
    const takeoverBtn = screen.getByRole('button', { name: '人机接管模式切换' });
    expect(screen.getByText('智能体自治 · 观察模式')).toBeDefined();
    expect(takeoverBtn.className).toContain('h-7');
    expect(takeoverBtn.className).toContain('w-7');
    expect(takeoverBtn.querySelector('svg')).not.toBeNull();

    // Switch to human takeover
    fireEvent.click(takeoverBtn);
    expect(useCockpitStore.getState().takeoverMode).toBe('human');
    expect(screen.getByText('人工接管中 · 智能体挂起')).toBeDefined();
    // After takeover, retains fixed h-7 w-7 dimensions (pure SVG icon morphing)
    expect(takeoverBtn.className).toContain('h-7');
    expect(takeoverBtn.className).toContain('w-7');

    // Input prompt becomes active
    const input = screen.getByPlaceholderText('输入救火 Bash 命令并按回车执行...');
    expect(input).toBeDefined();

    // Enter a command
    fireEvent.change(input, { target: { value: 'ulimit -f unlimited' } });
    fireEvent.submit(screen.getByRole('button', { name: '执行命令' }));

    const logs = useCockpitStore.getState().terminalLogs;
    expect(logs.some((l) => l.text === '$ ulimit -f unlimited')).toBe(true);
  });

  it('supports dragging top handle to adjust height and memorizes preference', () => {
    useCockpitStore.setState({ terminalHeight: 340 });
    render(<SreTerminalDrawer />);

    const handle = screen.getByLabelText('拖拽调整终端高度');
    expect(handle).toBeDefined();

    // Trigger drag upward
    fireEvent.pointerDown(handle, { button: 0, clientY: 500 });
    fireEvent(window, new MouseEvent('pointermove', { clientY: 400 })); // dragged 100px up
    fireEvent(window, new MouseEvent('pointerup'));

    // Height should have increased by ~100px
    const nextH = useCockpitStore.getState().terminalHeight;
    expect(nextH).toBe(440);
    expect(localStorage.getItem('linuxops_terminal_height')).toBe('440');
  });
});
