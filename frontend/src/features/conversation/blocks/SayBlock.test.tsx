import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SayBlock } from './SayBlock';

describe('SayBlock (Channel B: SRE Decision Window)', () => {
  it('renders SRE INFERENCE micro-tag and 2px solid left boundary', () => {
    const { container } = render(
      <SayBlock
        item={{
          kind: 'say',
          seq: 1,
          turn: 5,
          text: '系统运行平稳，正在分析内核遥测数据。',
          streaming: false,
        }}
      />,
    );

    expect(screen.getByText('SRE INFERENCE')).toBeDefined();
    expect(screen.getByText('第 5 回合')).toBeDefined();

    // Verify 2px left border
    const outer = container.firstChild as HTMLElement;
    expect(outer.className).toContain('border-l-2');
  });

  it('highlights 现状 and 下一步 in heavy ink and highlights system paths', () => {
    render(
      <SayBlock
        item={{
          kind: 'say',
          seq: 2,
          turn: 3,
          text: '【现状】iostat 未安装，已通过 /proc/diskstats 读取原始扇区遥测。\n【下一步】计算 I/O avg300 加权衰减。',
          streaming: false,
        }}
      />,
    );

    const xianzhuang = screen.getByText('【现状】');
    expect(xianzhuang).toBeDefined();
    expect(xianzhuang.className).toContain('font-semibold');
    expect(xianzhuang.className).toContain('text-ink-heavy');

    const xiayibu = screen.getByText('【下一步】');
    expect(xiayibu).toBeDefined();
    expect(xiayibu.className).toContain('font-semibold');
    expect(xiayibu.className).toContain('text-ink-heavy');

    const pathCode = screen.getByText('/proc/diskstats');
    expect(pathCode.tagName.toLowerCase()).toBe('code');
  });

  it('renders progress percentage when progress format is parsed', () => {
    render(
      <SayBlock
        item={{
          kind: 'say',
          seq: 3,
          turn: 2,
          text: '进度：正在扫描系统端口 约 60%\n诊断中...',
          streaming: false,
        }}
      />,
    );

    expect(screen.getByText('60%')).toBeDefined();
    expect(screen.getByText('正在扫描系统端口')).toBeDefined();
  });
});
