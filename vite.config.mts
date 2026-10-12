import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

const fromRoot = (path: string) =>
    fileURLToPath(new URL(path, import.meta.url))

// https://vite.dev/config/
export default defineConfig({
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
})
