import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useCockpitStore } from '../../stores/useCockpitStore';
import { SreArtifactDrawer } from './SreArtifactDrawer';

describe('SreArtifactDrawer', () => {
  beforeEach(() => {
    useCockpitStore.setState({
      activeArtifact: {
        open: true,
        title: '巡检调优大盘.md',
        content: '# 标题一\n内容一\n\n```bash\nulimit -f unlimited\n```\n\n## 标题二\n内容二',
        path: '/var/log/inspection.md',
      },
    });
  });

  it('renders drawer with title, path and TOC navigation outline', () => {
    render(<SreArtifactDrawer />);
    expect(screen.getByText('巡检调优大盘.md')).toBeDefined();
    expect(screen.getByText(/PATH: \/var\/log\/inspection.md/)).toBeDefined();
    expect(screen.getAllByText('标题一').length).toBeGreaterThan(0);
    expect(screen.getAllByText('标题二').length).toBeGreaterThan(0);
  });

  it('extracts bash blocks into an executable Playbook script on button click', () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: { writeText },
    });

    render(<SreArtifactDrawer />);
    const extractBtn = screen.getByRole('button', { name: '提取自愈 Playbook' });
    expect(extractBtn.className).toContain('h-7');
    expect(extractBtn.className).toContain('w-7');
    expect(extractBtn.querySelector('svg')).not.toBeNull();
    fireEvent.click(extractBtn);

    expect(writeText).toHaveBeenCalled();
    const copiedText = writeText.mock.calls[0]?.[0] as string;
    expect(copiedText).toContain('#!/usr/bin/env bash');
    expect(copiedText).toContain('ulimit -f unlimited');
    expect(screen.getByText('已复制 Playbook')).toBeDefined();
    // After copy, it still retains h-7 w-7 container (zero text expansion jitter)
    expect(extractBtn.className).toContain('h-7');
    expect(extractBtn.className).toContain('w-7');
  });

  it('closes drawer when close button is clicked', () => {
    render(<SreArtifactDrawer />);
    const closeBtn = screen.getByRole('button', { name: '关闭抽屉' });
    fireEvent.click(closeBtn);

    expect(useCockpitStore.getState().activeArtifact.open).toBe(false);
  });

  it('toggles TOC collapse and expansion smoothly', () => {
    useCockpitStore.setState({ tocCollapsed: false });
    render(<SreArtifactDrawer />);

    // Initially TOC is expanded, "收起大纲" button is visible
    const collapseBtn = screen.getByRole('button', { name: '收起大纲' });
    expect(collapseBtn.className).toContain('h-6');
    expect(collapseBtn.className).toContain('w-6');
    expect(collapseBtn.querySelector('svg')).not.toBeNull();
    fireEvent.click(collapseBtn);
    expect(useCockpitStore.getState().tocCollapsed).toBe(true);

    // After collapsing, "展开大纲" button appears
    const expandBtn = screen.getByRole('button', { name: '展开大纲' });
    expect(expandBtn.className).toContain('h-6');
    expect(expandBtn.className).toContain('w-6');
    fireEvent.click(expandBtn);
    expect(useCockpitStore.getState().tocCollapsed).toBe(false);
  });
});
