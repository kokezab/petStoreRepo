import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { useThemeStore } from '@/stores/useThemeStore';

import { ThemeToggle } from './ThemeToggle';

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

describe('ThemeToggle', () => {
  afterEach(() => {
    useThemeStore.setState({
      theme: 'light',
    });
  });

  it('reflects the current store theme via aria-checked', async () => {
    useThemeStore.setState({ theme: 'dark' });

    render(<ThemeToggle />);

    expect(await screen.findByRole('switch')).toHaveAttribute('aria-checked', 'true');
  });

  it('reflects light theme as unchecked', async () => {
    useThemeStore.setState({ theme: 'light' });

    render(<ThemeToggle />);

    expect(await screen.findByRole('switch')).toHaveAttribute('aria-checked', 'false');
  });

  it('calls the store toggleTheme action on click', async () => {
    const user = userEvent.setup();
    useThemeStore.setState({ theme: 'light' });

    render(<ThemeToggle />);
    const switchEl = await screen.findByRole('switch');
    await user.click(switchEl);

    expect(useThemeStore.getState().theme).toBe('dark');
  });

  it('toggles back on a second click', async () => {
    const user = userEvent.setup();
    useThemeStore.setState({ theme: 'light' });

    render(<ThemeToggle />);
    const toggle = screen.getByRole('switch');
    await user.click(toggle);
    await user.click(toggle);

    expect(useThemeStore.getState().theme).toBe('light');
  });

  it('supports toggling via the keyboard', async () => {
    const user = userEvent.setup();
    useThemeStore.setState({ theme: 'light' });

    render(<ThemeToggle />);
    await user.tab();
    expect(screen.getByRole('switch')).toHaveFocus();

    await user.keyboard('{Enter}');
    expect(useThemeStore.getState().theme).toBe('dark');
  });

  it('updates when the store changes externally', () => {
    useThemeStore.setState({ theme: 'light' });
    render(<ThemeToggle />);

    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'false');

    act(() => {
      useThemeStore.setState({ theme: 'dark' });
    });

    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true');
  });

  it('defaults to dark when the system prefers dark and no theme has been persisted', () => {
    mockMatchMedia(true);
    useThemeStore.persist.clearStorage();

    render(<ThemeToggle />);

    expect(useThemeStore.getState().theme).toBe('dark');
  });

  it('defaults to light when the system does not prefer dark and no theme has been persisted', () => {
    mockMatchMedia(false);
    useThemeStore.persist.clearStorage();

    render(<ThemeToggle />);

    expect(useThemeStore.getState().theme).toBe('light');
  });

  it('does not override an already-persisted theme with the system preference', () => {
    mockMatchMedia(true);
    useThemeStore.setState({ theme: 'light' });

    render(<ThemeToggle />);

    expect(useThemeStore.getState().theme).toBe('light');
  });

  it('displays "Dark mode" label when theme is dark', () => {
    useThemeStore.setState({ theme: 'dark' });

    render(<ThemeToggle />);

    expect(screen.getByText('Dark mode')).toBeInTheDocument();
  });

  it('displays "Light mode" label when theme is light', () => {
    useThemeStore.setState({ theme: 'light' });

    render(<ThemeToggle />);

    expect(screen.getByText('Light mode')).toBeInTheDocument();
  });
});
