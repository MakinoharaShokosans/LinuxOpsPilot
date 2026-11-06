import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { useCockpitStore } from '../../stores/useCockpitStore';
import { useUiStore } from '../../stores/useUiStore';
import { emptyRun, type RunState } from '../../stores/taskReducer';
import { RunView } from './RunView';

function renderWithClient(ui: React.ReactElement) {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

describe('RunView Artifact Trigger Button', () => {
  const mockRun: RunState = {
    ...emptyRun('t-1', '巡检任务', 'succeeded'),
    totalTokens: 1200,
    stepCount: 3,
    delivery: '# 巡检结果\n系统状态良性',
  };

  beforeEach(() => {
    useCockpitStore.setState({
      activeArtifact: { open: false, title: '', content: '', path: '' },
    });
    useUiStore.setState({ inspectorOpen: false });
  });

  it('renders a 32x32px pure SVG icon button without verbose Chinese text', () => {
    renderWithClient(<RunView run={mockRun} live={false} />);

    // The button must NOT contain verbose Chinese text like "展开 480px 产物抽屉"
    expect(screen.queryByText(/展开 480px 产物抽屉/)).toBeNull();

    // The button must be accessible via its aria-label and have w-8 h-8 (32x32px)
    const btn = screen.getByRole('button', { name: '展开产物抽屉' });
    expect(btn).toBeDefined();
    expect(btn.className).toContain('h-8');
    expect(btn.className).toContain('w-8');
    expect(btn.querySelector('svg')).not.toBeNull();
  });

  it('opens artifact drawer and inspector when clicked', () => {
    renderWithClient(<RunView run={mockRun} live={false} />);

    const btn = screen.getByRole('button', { name: '展开产物抽屉' });
    fireEvent.click(btn);

    const cockpitState = useCockpitStore.getState();
    expect(cockpitState.activeArtifact.open).toBe(true);
    expect(cockpitState.activeArtifact.title).toBe('系统全要素巡检与调优诊断大盘.md');
    expect(cockpitState.activeArtifact.content).toBe(mockRun.delivery);
    expect(useUiStore.getState().inspectorOpen).toBe(true);
  });
});
