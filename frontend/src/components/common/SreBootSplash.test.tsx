import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SreBootSplash } from './SreBootSplash';

describe('SreBootSplash', () => {
  const originalNodeEnv = process.env.NODE_ENV;

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    process.env.NODE_ENV = originalNodeEnv;
  });

  it('bypasses splash automatically during tests unless force is enabled', () => {
    const { container } = render(<SreBootSplash />);
    expect(container.firstChild).toBeNull();
  });

  it('runs complete 5-act 2.3s architectural sequence when forced or on page load', () => {
    const { container } = render(<SreBootSplash force />);
    expect(container.querySelector('[role="presentation"]')).not.toBeNull();

    // Advance to Act 2 (400ms ~ 950ms)
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(screen.getByText(/HOST: 127.0.0.1/)).not.toBeNull();
    expect(screen.getByText(/KERNEL: 6.8.0-sre/)).not.toBeNull();
    expect(screen.getByText(/PROBES: ATTACHED/)).not.toBeNull();

    // Advance to Act 3 (950ms ~ 1600ms)
    act(() => {
      vi.advanceTimersByTime(600);
    });
    expect(screen.getByText(/CATALYZING_BLUEPRINT/)).not.toBeNull();

    // Advance to Act 5 (2100ms ~ 2350ms)
    act(() => {
      vi.advanceTimersByTime(1100);
    });
    expect(screen.getByText(/SRE HARNESS ONLINE/)).not.toBeNull();

    // Advance to completion (>2350ms)
    act(() => {
      vi.advanceTimersByTime(400);
    });
    expect(container.querySelector('[role="presentation"]')).toBeNull();
  });
});
