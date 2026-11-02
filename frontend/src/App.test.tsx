import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from './App';

describe('App', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('renders the shell and asks the backend for sessions', async () => {
    const fetchMock = vi.fn(
      async (url: string) =>
        new Response(
          JSON.stringify(
            String(url).includes('/sessions') || String(url).includes('/workspaces') ? [] : {},
          ),
          {
            status: 200,
            headers: { 'content-type': 'application/json' },
          },
        ),
    );
    vi.stubGlobal('fetch', fetchMock);
    render(<App />);
    expect(await screen.findByLabelText('侧栏')).toBeInTheDocument();
    // 零工作区模式：侧栏与主区均提供「新建对话」动作
    await waitFor(() =>
      expect(screen.getAllByRole('button', { name: '新建对话' }).length).toBeGreaterThan(0),
    );
    const calls = fetchMock.mock.calls.map((c) => String(c[0]));
    expect(calls.some((u) => u === '/api/v1/sessions')).toBe(true);
    expect(calls.every((u) => !u.includes('token='))).toBe(true);
  });
});
