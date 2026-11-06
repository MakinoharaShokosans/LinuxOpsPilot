import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SreEntityPeek, SRE_ENTITIES } from './SreEntityPeekCard';

describe('SreEntityPeek', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('renders children with dashed underline probe', () => {
    const { container } = render(
      <SreEntityPeek entityKey="SIGXFSZ">
        <code>SIGXFSZ</code>
      </SreEntityPeek>,
    );

    const trigger = container.querySelector('span.cursor-help');
    expect(trigger).not.toBeNull();
    expect(trigger?.textContent).toBe('SIGXFSZ');
  });

  it('falls back to plain children if entity key is unknown', () => {
    const { container } = render(
      <SreEntityPeek entityKey="UNKNOWN_KEY">
        <span>plain text</span>
      </SreEntityPeek>,
    );
    expect(container.querySelector('span.cursor-help')).toBeNull();
    expect(container.textContent).toBe('plain text');
  });

  it('opens peek card with 200ms hover delay and closes with 150ms buffer', async () => {
    const { container } = render(
      <SreEntityPeek entityKey="SIGXFSZ">
        <span>SIGXFSZ</span>
      </SreEntityPeek>,
    );

    const trigger = container.querySelector('span.cursor-help')!;

    // Mouse enter: should not open immediately (requires 200ms delay)
    fireEvent.mouseEnter(trigger);
    expect(screen.queryByText('POSIX 信号定义')).toBeNull();

    // Fast forward 190ms: still not open
    act(() => {
      vi.advanceTimersByTime(190);
    });
    expect(screen.queryByText('POSIX 信号定义')).toBeNull();

    // Fast forward another 20ms (total 210ms): now open!
    act(() => {
      vi.advanceTimersByTime(20);
    });
    expect(screen.getByText('POSIX 信号定义')).not.toBeNull();
    expect(screen.getByText('SIGXFSZ (Signal 25)')).not.toBeNull();
    expect(screen.getAllByText(/ulimit -f unlimited/).length).toBeGreaterThan(0);

    // Mouse leave: should remain open during 150ms buffer
    fireEvent.mouseLeave(trigger);
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(screen.getByText('POSIX 信号定义')).not.toBeNull();

    // Fast forward past 150ms buffer + exit animation: closes
    act(() => {
      vi.advanceTimersByTime(250);
    });
    expect(screen.queryByText('POSIX 信号定义')).toBeNull();
  });

  it('copies command on copy button click', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: { writeText },
    });

    const { container } = render(
      <SreEntityPeek entityKey="/usr/bin/head">
        <span>/usr/bin/head</span>
      </SreEntityPeek>,
    );

    const trigger = container.querySelector('span.cursor-help')!;
    fireEvent.mouseEnter(trigger);
    act(() => {
      vi.advanceTimersByTime(200);
    });

    const copyBtn = screen.getByRole('button', { name: '复制命令' });
    expect(copyBtn).not.toBeNull();
    expect(copyBtn.className).toContain('h-7');
    expect(copyBtn.className).toContain('w-7');
    expect(copyBtn.querySelector('svg')).not.toBeNull();

    fireEvent.click(copyBtn);
    expect(writeText).toHaveBeenCalledWith('/usr/bin/head');

    // Button transitions to "已复制" while maintaining fixed h-7 w-7 geometry
    expect(screen.getByText('已复制')).not.toBeNull();
    expect(copyBtn.className).toContain('h-7');
    expect(copyBtn.className).toContain('w-7');
  });

  it('has detailed SRE specs for all 5 core entities', () => {
    const keys = [
      'SIGXFSZ',
      '/usr/bin/head',
      'IO pressure 86%',
      'taint=12288',
      'docker-forwarding',
    ];
    for (const key of keys) {
      const entity = SRE_ENTITIES[key];
      expect(entity).toBeDefined();
      expect(entity?.specs.length).toBeGreaterThan(0);
      expect(entity?.commandToCopy).toBeDefined();
    }
  });
});
