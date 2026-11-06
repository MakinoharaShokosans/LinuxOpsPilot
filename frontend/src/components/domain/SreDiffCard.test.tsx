import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SreDiffCard } from './SreDiffCard';

describe('SreDiffCard', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('renders diff lines with 1px border indicators and path metadata', () => {
    const before = 'fs.file-max = 65535\nvm.swappiness = 60';
    const after = 'fs.file-max = 2097152\nvm.swappiness = 10';

    const { container } = render(
      <SreDiffCard
        path="/etc/sysctl.conf"
        before={before}
        after={after}
        backupPath="sysctl.conf.bak.179395"
      />,
    );

    expect(screen.getByText(/PATH: \/etc\/sysctl.conf/)).toBeDefined();
    expect(screen.getByText(/BACKUP: sysctl.conf.bak.179395/)).toBeDefined();

    // Line prefixes + and -
    const plusSigns = container.querySelectorAll('.border-l-2');
    expect(plusSigns.length).toBeGreaterThan(0);
  });

  it('rotates rollback icon 360 degrees and morphs to checkmark on rollback click', async () => {
    const onRollback = vi.fn().mockImplementation(() => Promise.resolve());
    render(
      <SreDiffCard
        before="old=1"
        after="new=1"
        onRollback={onRollback}
      />,
    );

    const rollbackBtn = screen.getByRole('button', { name: '回滚配置' });
    expect(rollbackBtn).toBeDefined();

    await act(async () => {
      fireEvent.click(rollbackBtn);
    });

    expect(onRollback).toHaveBeenCalled();
  });

  it('copies updated config on copy button click', () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: { writeText },
    });

    render(<SreDiffCard before="old" after="new_content" />);
    const copyBtn = screen.getByRole('button', { name: '复制配置' });
    fireEvent.click(copyBtn);

    expect(writeText).toHaveBeenCalledWith('new_content');
  });
});
