import { defineConfig, devices } from '@playwright/test'
import { env } from './tests/e2e-full-stack/env'

/**
 * La suite contra el sistema real (S9.1): core, invoicing, Kafka, PostgreSQL y
 * el SRI (un simulador o `celcer`). No levanta nada ni usa mocks: la corre
 * `faclab-infra/e2e/run.sh`, que crea el entorno y lo destruye al terminar.
 */
export default defineConfig({
    testDir: './tests/e2e-full-stack',
    testMatch: /.*\.spec\.ts/,
    globalSetup: './tests/e2e-full-stack/globalSetup.ts',
    outputDir: './test-results-full-stack',

    // Un solo flujo con estado: sin paralelismo ni reintentos, que repetirían
    // ventas sobre el turno a medias
    workers: 1,
    retries: 0,
    forbidOnly: !!process.env.CI,

    // La factura y la nota de crédito viajan por Kafka y el SRI
    timeout: 10 * 60_000,
    expect: { timeout: 20_000 },

    reporter: [
        ['list'],
        [
            'html',
            { open: 'never', outputFolder: 'playwright-report-full-stack' },
        ],
    ],

    use: {
        baseURL: env.webUrl,
        locale: 'es-EC',
        timezoneId: 'America/Guayaquil',
        actionTimeout: 20_000,
        navigationTimeout: 30_000,
        // Con un certificado real (celcer) no se guarda nada de la sesión
        trace: env.sri === 'celcer' ? 'off' : 'retain-on-failure',
        screenshot: env.sri === 'celcer' ? 'off' : 'only-on-failure',
        video: 'off',
    },

    projects: [
        {
            name: 'full-stack',
            use: {
                ...devices['Desktop Chrome'],
                viewport: { width: 1440, height: 900 },
            },
        },
    ],
})
