import { test, expect } from '../support/test'
import { mockEmptyBackend } from '../fixtures/backend'
import { mockSuppliers } from '../fixtures/suppliers'
import { mockPOS } from '../fixtures/pos'
import { dashboard } from '../fixtures/dashboard'
import { ADMIN, ok } from '../support/mockApi'
import type { Page } from '@playwright/test'

/**
 * Regresiones visuales de las pantallas clave, en escritorio y móvil.
 *
 * Las referencias viven en `__screenshots__/` y llevan el sistema operativo en
 * el nombre: el antialiasing de las fuentes cambia entre plataformas, así que
 * unas capturas tomadas en macOS no sirven para comparar en Linux.
 *
 * Solo se actualizan cuando el cambio visual es intencional y se revisó:
 *   npm run test:e2e:update
 */

// La cabecera del POS y el pie del login muestran la fecha y la hora.
const FIXED_NOW = new Date('2026-01-15T15:30:00.000Z')

const settle = async (page: Page) => {
    // Sin cursor encima: el último elemento pulsado no queda en estado hover
    await page.mouse.move(0, 0)
    await page.evaluate(() => document.fonts.ready)
    await expect(page.getByLabel('Cargando')).toHaveCount(0)
}

const darkMode = (page: Page) =>
    page.addInitScript(() =>
        window.localStorage.setItem(
            'theme-storage',
            JSON.stringify({
                state: { mode: 'dark', sideNavCollapse: false },
                version: 1,
            })
        )
    )

test.describe('Capturas de referencia', () => {
    test.beforeEach(async ({ page }) => {
        await page.clock.setFixedTime(FIXED_NOW)
    })

    test('inicio de sesión', async ({ page }) => {
        await page.goto('/sign-in')
        await expect(
            page.getByRole('button', { name: 'Ingresar' })
        ).toBeVisible()
        await settle(page)

        await expect(page).toHaveScreenshot('sign-in.png')
    })

    test('resumen', async ({ page, api, signIn }) => {
        mockEmptyBackend(api)
        api.get(`${ADMIN}/dashboard`, () => ok(dashboard()))
        await signIn()
        await page.goto('/home')
        await expect(page.getByText('$48.250,75')).toBeVisible()
        await settle(page)

        await expect(page).toHaveScreenshot('home.png', { fullPage: true })
    })

    test('resumen en modo oscuro', async ({ page, api, signIn }) => {
        mockEmptyBackend(api)
        api.get(`${ADMIN}/dashboard`, () => ok(dashboard()))
        await signIn()
        await darkMode(page)
        await page.goto('/home')
        await expect(page.getByText('$48.250,75')).toBeVisible()
        await settle(page)

        await expect(page).toHaveScreenshot('home-dark.png', {
            fullPage: true,
        })
    })

    test('lista de proveedores', async ({ page, api, signIn }) => {
        mockSuppliers(api)
        await signIn()
        await page.goto('/suppliers')
        await expect(
            page.getByRole('row').filter({ hasText: 'Maderas del Austro' })
        ).toBeVisible()
        await settle(page)

        await expect(page).toHaveScreenshot('suppliers.png')
    })

    test('formulario de proveedor con errores', async ({
        page,
        api,
        signIn,
    }) => {
        mockSuppliers(api)
        await signIn()
        await page.goto('/suppliers')
        await page.getByRole('button', { name: 'Nuevo proveedor' }).click()
        const dialog = page.getByRole('dialog', { name: 'Nuevo proveedor' })
        await dialog.getByRole('button', { name: 'Guardar' }).click()
        await expect(dialog.getByText('Nombre requerido')).toBeVisible()
        await settle(page)

        await expect(page).toHaveScreenshot('supplier-form.png')
    })

    test('punto de venta con una orden', async ({ page, api, signIn }) => {
        mockPOS(api)
        await signIn()
        await page.goto('/pos')
        const products = page.getByRole('region', { name: 'Productos' })
        await products.getByRole('button', { name: /Tablero MDF 15mm/ }).click()
        await products
            .getByRole('button', { name: /Bisagra cazoleta 35mm/ })
            .click()
        await settle(page)

        await expect(page).toHaveScreenshot('pos.png')
    })
})
