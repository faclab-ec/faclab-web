import { test, expect } from '../support/test'
import { mockEmptyBackend } from '../fixtures/backend'
import { POS, ok } from '../support/mockApi'

// Cada pantalla del menú, con el título que debe mostrar.
const SCREENS = [
    { path: '/home', heading: 'Resumen' },
    { path: '/catalog/categories', heading: 'Categorías' },
    { path: '/catalog/products', heading: 'Productos' },
    { path: '/catalog/units-of-measure', heading: 'Unidades de Medida' },
    { path: '/stock', heading: 'Stock' },
    { path: '/movements', heading: 'Movimientos' },
    { path: '/warehouses', heading: 'Almacenes' },
    { path: '/locations', heading: 'Ubicaciones' },
    { path: '/lots', heading: 'Lotes' },
    { path: '/serials', heading: 'Números de Serie' },
    { path: '/adjustments', heading: 'Ajustes de Inventario' },
    { path: '/transfers', heading: 'Transferencias de Inventario' },
    { path: '/alerts', heading: 'Alertas de Inventario' },
    { path: '/reports/inventory', heading: 'Reportes de Inventario' },
    { path: '/customers', heading: 'Clientes' },
    { path: '/sales', heading: 'Ventas' },
    { path: '/invoices', heading: 'Facturas' },
    { path: '/shifts', heading: 'Turnos' },
    { path: '/refunds', heading: 'Devoluciones' },
    { path: '/reports/pos', heading: 'Reportes POS' },
    { path: '/suppliers', heading: 'Proveedores' },
    { path: '/purchase-orders', heading: 'Órdenes de Compra' },
    { path: '/settings/users', heading: 'Usuarios' },
    { path: '/settings/company-config', heading: 'Perfil fiscal' },
    { path: '/settings/certificates', heading: 'Certificados Digitales' },
]

test.describe('Arranque', () => {
    test('sin sesión, la app abre en el inicio de sesión', async ({ page }) => {
        await page.goto('/')

        await expect(page).toHaveURL(/\/sign-in/)
        await expect(
            page.getByRole('heading', { name: 'Bienvenido' })
        ).toBeVisible()
        await expect(page.getByLabel('Usuario', { exact: true })).toBeVisible()
        await expect(
            page.getByLabel('Contraseña', { exact: true })
        ).toBeVisible()
        await expect(
            page.getByRole('button', { name: 'Ingresar' })
        ).toBeEnabled()
    })

    test('la página declara idioma y título de Faclab', async ({ page }) => {
        await page.goto('/sign-in')

        await expect(page).toHaveTitle(/Faclab/)
        await expect(page.locator('html')).toHaveAttribute('lang', 'es')
    })
})

test.describe('Pantallas principales', () => {
    test.beforeEach(async ({ api, signIn }) => {
        mockEmptyBackend(api)
        await signIn()
    })

    for (const screen of SCREENS) {
        test(`${screen.path} abre y muestra "${screen.heading}"`, async ({
            page,
        }) => {
            await page.goto(screen.path)

            await expect(
                page.getByRole('heading', { name: screen.heading, exact: true })
            ).toBeVisible()
            // Sin datos, una lista no puede quedarse cargando para siempre
            await expect(page.getByLabel('Cargando')).toHaveCount(0)
        })
    }

    test('el punto de venta pide abrir turno cuando no hay uno activo', async ({
        page,
        api,
    }) => {
        api.get(`${POS}/shifts/active`, () => ok(null))

        await page.goto('/pos')

        await expect(
            page.getByRole('heading', { name: 'Abrir turno' })
        ).toBeVisible()
        await expect(page.getByLabel('Saldo inicial')).toBeVisible()
    })
})
