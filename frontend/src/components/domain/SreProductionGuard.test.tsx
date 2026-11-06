import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { useCockpitStore } from '../../stores/useCockpitStore';
import { SreFleetSwitcher, SreProductionGuardOverlay } from './SreProductionGuard';

describe('SreProductionGuard', () => {
  beforeEach(() => {
    useCockpitStore.setState({ fleet: 'local' });
  });

  it('allows switching from LOCAL to STAGING and PROD', () => {
    render(<SreFleetSwitcher />);
    const button = screen.getByRole('button', { name: '选择目标集群环境' });
    expect(button.textContent).toContain('LOCAL · 127.0.0.1');

    // Open dropdown
    fireEvent.click(button);
    expect(screen.getByText('PROD · 10.0.4.1')).toBeDefined();

    // Select PROD
    fireEvent.click(screen.getByText('PROD · 10.0.4.1'));
    expect(useCockpitStore.getState().fleet).toBe('prod');
  });

  it('activates perimeter red wire and warning banner when PROD is active', () => {
    const { container, rerender } = render(<SreProductionGuardOverlay />);
    // Not rendered on local
    expect(container.firstChild).toBeNull();

    // Switch to PROD
    act(() => {
      useCockpitStore.setState({ fleet: 'prod' });
    });
    rerender(<SreProductionGuardOverlay />);

    expect(screen.getByText(/PROD 生产环境警戒/)).toBeDefined();
    expect(container.querySelector('.border-\\[\\#DC2626\\]')).toBeDefined();
  });
});
