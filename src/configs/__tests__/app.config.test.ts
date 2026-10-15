import { afterEach, describe, expect, it, vi } from 'vitest'

const loadConfig = async () => {
    vi.resetModules()
    return (await import('../app.config')).default
}

describe('appConfig', () => {
    afterEach(() => {
        delete window.__FACLAB_CONFIG__
        vi.unstubAllEnvs()
    })

    it('usa las URLs de /config.js por encima de VITE_*', async () => {
        vi.stubEnv('VITE_API_BASE_URL', 'http://vite-api.test')
        vi.stubEnv('VITE_INVOICING_API_URL', 'http://vite-invoicing.test')
        window.__FACLAB_CONFIG__ = {
            apiBaseUrl: 'https://api.example.test',
            invoicingApiUrl: 'https://invoicing.example.test',
        }

        const config = await loadConfig()

        expect(config.apiBaseUrl).toBe('https://api.example.test')
        expect(config.authApiHost).toBe('https://api.example.test/api/auth')
        expect(config.adminUsersApiHost).toBe(
            'https://api.example.test/api/admin/users'
        )
        expect(config.inventoryApiHost).toBe(
            'https://api.example.test/api/admin'
        )
        expect(config.posApiHost).toBe('https://api.example.test/api/pos')
        expect(config.invoicingApiHost).toBe('https://invoicing.example.test')
    })

    it('con /config.js vacío usa VITE_*', async () => {
        vi.stubEnv('VITE_API_BASE_URL', 'http://vite-api.test')
        vi.stubEnv('VITE_INVOICING_API_URL', 'http://vite-invoicing.test')
        window.__FACLAB_CONFIG__ = {}

        const config = await loadConfig()

        expect(config.apiBaseUrl).toBe('http://vite-api.test')
        expect(config.invoicingApiHost).toBe('http://vite-invoicing.test')
    })

    it('completa con VITE_* lo que /config.js no define', async () => {
        vi.stubEnv('VITE_INVOICING_API_URL', 'http://vite-invoicing.test')
        window.__FACLAB_CONFIG__ = { apiBaseUrl: 'https://api.example.test' }

        const config = await loadConfig()

        expect(config.apiBaseUrl).toBe('https://api.example.test')
        expect(config.invoicingApiHost).toBe('http://vite-invoicing.test')
    })

    it('sin /config.js ni VITE_* usa los servicios locales', async () => {
        vi.stubEnv('VITE_API_BASE_URL', undefined)
        vi.stubEnv('VITE_INVOICING_API_URL', undefined)

        const config = await loadConfig()

        expect(config.apiBaseUrl).toBe('http://localhost:3000')
        expect(config.invoicingApiHost).toBe('http://localhost:3173')
    })
})
