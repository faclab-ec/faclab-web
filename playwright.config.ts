import { defineConfig, devices } from '@playwright/test'

// Puerto propio para no chocar con un `npm start` ya abierto en el 5173.
const PORT = Number(process.env.E2E_PORT ?? 5199)
const BASE_URL = `http://127.0.0.1:${PORT}`

const isCI = !!process.env.CI

export default defineConfig({
    testDir: './tests/e2e/specs',
    globalSetup: './tests/e2e/support/globalSetup.ts',
    outputDir: './test-results',
    snapshotPathTemplate:
        '{testDir}/__screenshots__/{testFileName}/{arg}-{projectName}-{platform}{ext}',

    fullyParallel: true,
    forbidOnly: isCI,
    retries: isCI ? 2 : 0,
    // El servidor de desarrollo entrega cada módulo por separado y cada
    // prueba parte de un contexto sin caché: más de 4 workers lo saturan.
    workers: isCI ? 2 : 4,

    timeout: 45_000,
    expect: {
        timeout: 15_000,
        toHaveScreenshot: {
            animations: 'disabled',
            caret: 'hide',
            maxDiffPixelRatio: 0.01,
        },
    },

    reporter: [
        ['list'],
        ['html', { open: 'never', outputFolder: 'playwright-report' }],
    ],

    use: {
        baseURL: BASE_URL,
        locale: 'es-EC',
        timezoneId: 'America/Guayaquil',
        actionTimeout: 15_000,
        navigationTimeout: 30_000,
        trace: 'retain-on-failure',
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
    },

    projects: [
        {
            name: 'chromium',
            use: {
                ...devices['Desktop Chrome'],
                viewport: { width: 1440, height: 900 },
            },
        },
        {
            // Solo las pruebas escritas para ambos tamaños de pantalla.
            name: 'mobile',
            testMatch: /(responsive|visual)\.spec\.ts/,
            use: { ...devices['Pixel 7'] },
        },
        // Para ampliar la cobertura: `npx playwright install firefox webkit`
        // y descomentar.
        // { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
        // { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    ],

    webServer: {
        command: `npm start -- --host 127.0.0.1 --port ${PORT} --strictPort`,
        url: BASE_URL,
        reuseExistingServer: !isCI,
        timeout: 120_000,
        stdout: 'ignore',
        stderr: 'pipe',
        // Mismo origen que la app: las llamadas a la API no salen del
        // navegador (las responde `tests/e2e/support/mockApi.ts`) y no hay CORS.
        env: {
            VITE_API_BASE_URL: BASE_URL,
            VITE_INVOICING_API_URL: `${BASE_URL}/__invoicing`,
        },
    },
})
