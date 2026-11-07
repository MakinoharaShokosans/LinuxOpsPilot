import { beforeEach, describe, expect, it, vi } from 'vitest';

async function freshStore() {
  vi.resetModules();
  return (await import('./useUiStore')).useUiStore;
}

describe('useUiStore persistence', () => {
  beforeEach(() => window.localStorage.clear());

  it('restores saved preferences', async () => {
    window.localStorage.setItem(
      'baseagent.ui.v2',
      JSON.stringify({ theme: 'dark', inspectorOpen: false }),
    );
    const store = await freshStore();
    expect(store.getState().theme).toBe('dark');
    expect(store.getState().inspectorOpen).toBe(false);
  });

  it('writes changes back to the same key', async () => {
    window.localStorage.setItem('baseagent.ui.v2', JSON.stringify({ theme: 'light' }));
    const store = await freshStore();
    expect(store.getState().theme).toBe('light');
    store.getState().toggleInspector();
    expect(JSON.parse(window.localStorage.getItem('baseagent.ui.v2') ?? '{}').inspectorOpen).toBe(
      false,
    );
  });

  it('marks sessions as read and persists timestamp', async () => {
    const store = await freshStore();
    store.getState().markSessionRead('sess-1', 12345);
    expect(store.getState().readSessions['sess-1']).toBe(12345);
    expect(
      JSON.parse(window.localStorage.getItem('baseagent.ui.v2') ?? '{}').readSessions['sess-1'],
    ).toBe(12345);
  });

  it('manages settings modal visibility and sections in memory', async () => {
    const store = await freshStore();
    expect(store.getState().settingsOpen).toBe(false);
    expect(store.getState().settingsSection).toBe('general');

    store.getState().setSettingsOpen(true, 'skills');
    expect(store.getState().settingsOpen).toBe(true);
    expect(store.getState().settingsSection).toBe('skills');

    store.getState().setSettingsSection('mcp');
    expect(store.getState().settingsSection).toBe('mcp');

    store.getState().toggleSettings();
    expect(store.getState().settingsOpen).toBe(false);
  });
});
