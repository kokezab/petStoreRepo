import { applySystemThemePreferenceIfUnset, useThemeStore } from './useThemeStore';

function mockMatchMedia(prefersDark: boolean) {
  window.matchMedia = ((query: string) => ({
    matches: query === '(prefers-color-scheme: dark)' ? prefersDark : false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })) as typeof window.matchMedia;
}

describe('applySystemThemePreferenceIfUnset', () => {
  afterEach(() => {
    useThemeStore.setState({ theme: 'light' });
  });

  it('adopts dark when the system prefers dark and no theme has been persisted', () => {
    mockMatchMedia(true);
    useThemeStore.persist.clearStorage();

    applySystemThemePreferenceIfUnset();

    expect(useThemeStore.getState().theme).toBe('dark');
  });

  it('adopts light when the system does not prefer dark and no theme has been persisted', () => {
    mockMatchMedia(false);
    useThemeStore.persist.clearStorage();

    applySystemThemePreferenceIfUnset();

    expect(useThemeStore.getState().theme).toBe('light');
  });

  it('does not override an already-persisted theme with the system preference', () => {
    mockMatchMedia(true);
    // A persisted preference is present, so the system preference must be ignored.
    localStorage.setItem(
      'theme-storage',
      JSON.stringify({ state: { theme: 'light' }, version: 0 }),
    );
    useThemeStore.setState({ theme: 'light' });

    applySystemThemePreferenceIfUnset();

    expect(useThemeStore.getState().theme).toBe('light');
  });
});
