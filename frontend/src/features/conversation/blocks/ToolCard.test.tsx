import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ToolCard } from './ToolCard';

function renderCard(item: Parameters<typeof ToolCard>[0]['item']) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <ToolCard item={item} taskId="task-1" />
    </QueryClientProvider>,
  );
}

describe('ToolCard (Channel A: Machine Timeline Rail)', () => {
  it('renders unboxed collapsed timeline rail with branch mark and summary', () => {
    const { container } = renderCard({
      kind: 'tool',
      seq: 1,
      callId: 'c-1',
      tool: 'bash',
      args: { command: 'echo "=== iostat ==="' },
      step: 1,
      state: 'ok',
      startTs: 1000,
      endTs: 1000.464,
      durationMs: 464,
      exitCode: 0,
      stdout: '',
      stderr: '',
    });

    // Check branch symbol and tool badge
    expect(screen.getByText('⎿')).toBeDefined();
    expect(screen.getByText('[bash]')).toBeDefined();
    expect(screen.getByText('echo "=== iostat ==="')).toBeDefined();
    expect(screen.getByText('464ms')).toBeDefined();

    // Verify absence of 4-sided container borders or rounded-xl
    const outer = container.firstChild as HTMLElement;
    expect(outer.className).toContain('border-l');
    expect(outer.className).not.toContain('rounded-xl border bg-card');
  });

  it('renders exit code in bad color when command fails', () => {
    renderCard({
      kind: 'tool',
      seq: 2,
      callId: 'c-2',
      tool: 'bash',
      args: { command: 'iostat -x 1 2' },
      step: 2,
      state: 'failed',
      startTs: 1000,
      endTs: 1000.12,
      durationMs: 120,
      exitCode: 127,
      stdout: '',
      stderr: 'bash: iostat: command not found',
    });

    expect(screen.getByText(/exit 127/)).toBeDefined();
    expect(screen.getByText(/exit 127/).className).toContain('text-bad');
  });

  it('unfolds unboxed CMD and OUTPUT sections without nested pre boxes when clicked', () => {
    renderCard({
      kind: 'tool',
      seq: 3,
      callId: 'c-3',
      tool: 'bash',
      args: { command: 'cat /proc/diskstats' },
      step: 3,
      state: 'ok',
      result: '8 0 sda 100 200 300',
      startTs: 1000,
      endTs: 1000.08,
      durationMs: 80,
      exitCode: 0,
      stdout: '',
      stderr: '',
    });

    // Click to expand
    const trigger = screen.getByRole('button');
    fireEvent.click(trigger);

    // Shows bare CMD and OUTPUT labels
    expect(screen.getByText('CMD')).toBeDefined();
    expect(screen.getByText('OUTPUT')).toBeDefined();
    expect(screen.getAllByText('cat /proc/diskstats').length).toBeGreaterThan(0);
    expect(screen.getByText('8 0 sda 100 200 300')).toBeDefined();
    expect(screen.getByText(/第 3 回合/)).toBeDefined();
  });
});
