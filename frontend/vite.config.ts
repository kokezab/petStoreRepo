import babel from '@rolldown/plugin-babel'
import { sentryVitePlugin } from '@sentry/vite-plugin'
import tailwindcss from '@tailwindcss/vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import path from 'path'
import { defineConfig } from 'vite'

const version = process.env.npm_package_version ?? '0.0.0-dev'

// Where the Zero-Code backend actually runs. Defaults to the local springdoc
// port; override for a different local host without touching this file.
const zerocodeTarget = process.env.VITE_ZEROCODE_PROXY_TARGET ?? 'http://localhost:8090'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] }),
    tailwindcss(),
    // Only uploads source maps when SENTRY_AUTH_TOKEN is set (CI release
    // builds) - local/dev builds skip this silently rather than failing.
    sentryVitePlugin({
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      authToken: process.env.SENTRY_AUTH_TOKEN,
      disable: !process.env.SENTRY_AUTH_TOKEN,
      release: { name: version },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 5173,
    // Dev-only reverse proxy for the Zero-Code backend. The browser talks to
    // same-origin `localhost:5173`, Vite forwards server-side to :8090, so
    // there is no cross-origin request and no CORS to negotiate. The `/zerocode-api`
    // prefix is stripped before forwarding: `/zerocode-api/api/items` -> `/api/items`.
    // In prod, set VITE_ZEROCODE_API_BASE_URL to the real backend origin instead.
    proxy: {
      '/zerocode-api': {
        target: zerocodeTarget,
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/zerocode-api/, ''),
      },
    },
  },
  build: {
    sourcemap: true,
  },
  define: {
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
    __APP_VERSION__: JSON.stringify(version),
  },
})
