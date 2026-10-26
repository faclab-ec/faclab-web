import { chromium, type FullConfig } from '@playwright/test'
import { mockEmptyBackend } from '../fixtures/backend'
import { ADMIN, MockApi, POS, ok } from './mockApi'
import { buildBranch } from '../fixtures/organization'
import { signInAs } from './session'

// Una pantalla por chunk perezoso de la app.
const WARM_UP_PATHS = [
    '/home',
    '/catalog/categories',
    '/catalog/products',
    '/catalog/units-of-measure',
    '/stock',
    '/movements',
    '/warehouses',
    '/locations',
    '/lots',
    '/serials',
    '/adjustments',
    '/transfers',
    '/alerts',
    '/reports/inventory',
    '/customers',
    '/sales',
    '/invoices',
    '/shifts',
    '/refunds',
    '/reports/pos',
    '/suppliers',
    '/purchase-orders',
    '/settings/users',
    '/settings/company-config',
    '/settings/certificates',
    '/settings/sequences',
    '/settings/branches',
    '/settings/branches/1',
    '/pos',
    '/change-password',
    '/access-denied',
]

/**
 * El servidor de desarrollo compila cada módulo la primera vez que se pide.
 * Con varios workers en paralelo, esa primera compilación agotaba el tiempo
 * de las pruebas que tocaban cada pantalla por primera vez. Aquí se recorre
 * la app una vez, en serie, para que las pruebas encuentren todo compilado.
 */
export default async function globalSetup(config: FullConfig): Promise<void> {
    const baseURL = config.projects[0].use.baseURL
    const browser = await chromium.launch()

    try {
        // Sin sesión: layout de autenticación
        const guest = await browser.newPage({ baseURL })
        await guest.goto('/sign-in')
        await guest.getByRole('button', { name: 'Ingresar' }).waitFor()
        await guest.close()

        const page = await browser.newPage({ baseURL })
        const api = await MockApi.attach(page)
        mockEmptyBackend(api)
        api.get(`${POS}/shifts/active`, () => ok(null))
        api.get(`${ADMIN}/branches/:id`, () => ok(buildBranch()))
        await signInAs(page, api)

        for (const path of WARM_UP_PATHS) {
            await page.goto(path)
            await page.waitForLoadState('networkidle')
        }
    } finally {
        await browser.close()
    }
}
