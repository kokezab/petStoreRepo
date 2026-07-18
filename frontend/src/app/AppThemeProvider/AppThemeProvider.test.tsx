import { render, screen } from '@testing-library/react';
import { theme as antdTheme } from 'antd';

import { useThemeStore } from '@/stores/useThemeStore';

import { AppThemeProvider } from './AppThemeProvider';

describe('AppThemeProvider', () => {
  afterEach(() => {
    useThemeStore.setState({
      theme: 'light',
    });
  });

  it('renders children', () => {
    render(
      <AppThemeProvider>
        <div>content</div>
      </AppThemeProvider>,
    );

    expect(screen.getByText('content')).toBeInTheDocument();
  });

  it('applies the dark algorithm when theme is dark', () => {
    useThemeStore.setState({ theme: 'dark' });
    let capturedToken: { colorBgBase?: string } = {};

    function Probe() {
      capturedToken = antdTheme.useToken().token;
      return null;
    }

    render(
      <AppThemeProvider>
        <Probe />
      </AppThemeProvider>,
    );

    // Antd's dark algorithm sets colorBgBase to a dark value; default/light is '#fff'.
    expect(capturedToken.colorBgBase).not.toBe('#fff');
  });

});
