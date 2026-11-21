import { fileURLToPath, URL } from 'node:url'
import { loadEnv } from 'vite'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

const fromRoot = (path: string) =>
    fileURLToPath(new URL(path, import.meta.url))

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
    // Sin prefijo: lee también las variables que no van al navegador
    const env = loadEnv(mode, process.cwd(), '')

    // `service.version` de la telemetría (S7.3): SERVICE_VERSION del build de
    // la imagen (tag o SHA) o, sin él, la versión de package.json
    const appVersion = env.SERVICE_VERSION || env.npm_package_version || 'dev'

    // /otlp es del mismo origen que la app, como detrás de Caddy: el navegador
    // no necesita CORS hacia el Collector. En local reenvía al OTLP/HTTP de
    // SigNoz.
    const otlpProxy = {
        '/otlp': {
            target: env.OTLP_PROXY_TARGET || 'http://localhost:4318',
            changeOrigin: true,
            rewrite: (path: string) => path.replace(/^\/otlp/, ''),
        },
    }

    return {
        plugins: [
            react({
                babel: {
                    plugins: [
                        ['babel-plugin-react-compiler', { target: '19' }],
                        'babel-plugin-macros',
                    ],
                },
            }),
        ],
        define: {
            __APP_VERSION__: JSON.stringify(appVersion),
        },
        server: {
            proxy: otlpProxy,
        },
        preview: {
            proxy: otlpProxy,
        },
        resolve: {
            alias: {
                '@': fromRoot('./src'),
                '@app': fromRoot('./src/app'),
                '@features': fromRoot('./src/features'),
                '@shared': fromRoot('./src/shared'),
                '@stores': fromRoot('./src/stores'),
                '@configs': fromRoot('./src/configs'),
            },
        },
        build: {
            outDir: 'build',
        },
        test: {
            globals: true,
            environment: 'jsdom',
            setupFiles: ['./src/test/setup.ts'],
            include: ['src/**/*.{test,spec}.{ts,tsx}'],
            coverage: {
                provider: 'v8',
                reporter: ['text', 'lcov'],
                include: ['src/shared/**', 'src/app/**', 'src/features/**'],
            },
        },
    }
})
