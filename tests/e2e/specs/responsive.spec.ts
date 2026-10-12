import { test, expect } from '../support/test'
import { mockEmptyBackend } from '../fixtures/backend'
import { mockSuppliers } from '../fixtures/suppliers'
import { mockPOS } from '../fixtures/pos'
import { dashboard } from '../fixtures/dashboard'
import { ADMIN, ok } from '../support/mockApi'
import type { Page } from '@playwright/test'

/**
 * Estas pruebas corren en los proyectos `chromium` (1440 px) y `mobile`
 * (Pixel 7): cada una comprueba lo que debe cumplirse en ambos tamaños y, donde
 * la interfaz cambia, lo propio de cada uno.
 */

/** La página no debe poder desplazarse en horizontal. */
const expectNoHorizontalOverflow = async (page: Page) => {
    const overflow = await page.evaluate(() => {
        const root = document.documentElement
        return root.scrollWidth - root.clientWidth
    })
    expect(overflow, 'píxeles de desborde horizontal').toBeLessThanOrEqual(0)
}

const isMobile = (page: Page) => (page.viewportSize()?.width ?? 0) < 768

test.describe('Adaptabilidad', () => {
    test('inicio de sesión: el formulario cabe y se puede usar', async ({
        page,
    }) => {
        await page.goto('/sign-in')

        const submit = page.getByRole('button', { name: 'Ingresar' })
        await expect(submit).toBeInViewport()
        await expect(page.getByLabel('Usuario', { exact: true })).toBeVisible()
        await expect(page.getByRole('img', { name: 'Faclab' })).toBeVisible()
        await expectNoHorizontalOverflow(page)
    })

    test('resumen: los indicadores se reacomodan sin desbordar', async ({
        page,
        api,
        signIn,
    }) => {
        mockEmptyBackend(api)
        api.get(`${ADMIN}/dashboard`, () => ok(dashboard()))
        await signIn()
        await page.goto('/home')

        await expect(
            page.getByRole('heading', { name: 'Resumen', exact: true })
        ).toBeVisible()
        await expect(page.getByText('Valor del inventario')).toBeVisible()
        await expect(
            page.getByRole('list', {
                name: 'Valor del inventario por almacén',
            })
        ).toBeVisible()
        await expectNoHorizontalOverflow(page)
    })

    test('navegación: menú lateral en escritorio, panel desplegable en móvil', async ({
        page,
        api,
        signIn,
    }) => {
        mockEmptyBackend(api)
        await signIn()
        await page.goto('/home')
        const nav = page.getByRole('navigation', {
            name: 'Navegación principal',
        })

        if (isMobile(page)) {
            await expect(nav).toHaveCount(0)
            await page.getByRole('button', { name: 'Abrir menú' }).click()
            await expect(nav).toBeVisible()
            await nav.getByRole('link', { name: 'Clientes' }).click()
            // Elegir una opción cierra el panel
            await expect(nav).toBeHidden()
        } else {
            await expect(nav).toBeVisible()
            await nav.getByRole('link', { name: 'Clientes' }).click()
        }

        await expect(page).toHaveURL(/\/customers$/)
        await expect(
            page.getByRole('heading', { name: 'Clientes', exact: true })
        ).toBeVisible()
        await expectNoHorizontalOverflow(page)
    })

    test('lista: la tabla se desplaza dentro de su tarjeta, no la página', async ({
        page,
        api,
        signIn,
    }) => {
        mockSuppliers(api)
        await signIn()
        await page.goto('/suppliers')

        await expect(
            page.getByRole('row').filter({ hasText: 'Maderas del Austro' })
        ).toBeVisible()
        await expect(
            page.getByRole('button', { name: 'Nuevo proveedor' })
        ).toBeInViewport()
        await expectNoHorizontalOverflow(page)

        // Las acciones de la fila siguen alcanzables aunque queden fuera de vista
        const edit = page.getByRole('button', {
            name: 'Editar Maderas del Austro',
        })
        await edit.scrollIntoViewIfNeeded()
        await expect(edit).toBeInViewport()
    })

    test('formulario en diálogo: cabe en pantalla y sus botones son alcanzables', async ({
        page,
        api,
        signIn,
    }) => {
        mockSuppliers(api)
        await signIn()
        await page.goto('/suppliers')
        await page.getByRole('button', { name: 'Nuevo proveedor' }).click()
        const dialog = page.getByRole('dialog', { name: 'Nuevo proveedor' })

        await expect(dialog.getByLabel('Nombre', { exact: true })).toBeVisible()
        const save = dialog.getByRole('button', { name: 'Guardar' })
        await save.scrollIntoViewIfNeeded()
        await expect(save).toBeInViewport()

        const box = await dialog.boundingBox()
        const viewport = page.viewportSize()
        expect(box, 'el diálogo tiene tamaño').not.toBeNull()
        expect(box!.x).toBeGreaterThanOrEqual(0)
        expect(box!.x + box!.width).toBeLessThanOrEqual(viewport!.width)
    })

    test('punto de venta: dos paneles en escritorio, pestañas en móvil', async ({
        page,
        api,
        signIn,
    }) => {
        mockPOS(api)
        await signIn()
        await page.goto('/pos')
        const products = page.getByRole('region', { name: 'Productos' })
        const order = page.getByRole('complementary', { name: 'Orden' })
        await expect(
            products.getByRole('button', { name: /Tablero MDF 15mm/ })
        ).toBeVisible()

        await products.getByRole('button', { name: /Tablero MDF 15mm/ }).click()

        if (isMobile(page)) {
            await expect(order).toBeHidden()
            const orderTab = page.getByRole('tab', { name: 'Orden (1)' })
            await orderTab.click()
            await expect(orderTab).toHaveAttribute('aria-selected', 'true')
            await expect(products).toBeHidden()
        }

        await expect(order.getByText('Tablero MDF 15mm')).toBeVisible()
        await expect(
            order.getByRole('button', { name: 'Cobrar' })
        ).toBeInViewport()
        await expectNoHorizontalOverflow(page)
    })
})
