import { test, expect } from '../support/test'
import { mockCatalog } from '../fixtures/catalog'
import { ADMIN } from '../support/mockApi'
import type { Page } from '@playwright/test'

const row = (page: Page, name: string) =>
    page.getByRole('row').filter({ hasText: name })

test.describe('Productos', () => {
    test.beforeEach(async ({ api, signIn }) => {
        mockCatalog(api)
        await signIn()
    })

    test('lista los productos con su categoría y estado', async ({ page }) => {
        await page.goto('/catalog/products')

        await expect(row(page, 'Tablero MDF 15mm')).toContainText('Tableros')
        await expect(row(page, 'Tablero MDF 15mm')).toContainText('Activo')
        await expect(row(page, 'Servicio de corte')).toContainText(
            'Sin categoría'
        )
        await expect(row(page, 'Servicio de corte')).toContainText('Inactivo')
    })

    test('exige nombre y SKU', async ({ page, api }) => {
        await page.goto('/catalog/products')
        await page.getByRole('button', { name: 'Nuevo producto' }).click()
        const dialog = page.getByRole('dialog', { name: 'Nuevo producto' })

        await dialog.getByRole('button', { name: 'Guardar' }).click()

        await expect(dialog.getByText('Nombre requerido')).toBeVisible()
        await expect(dialog.getByText('SKU requerido')).toBeVisible()
        await expect(
            dialog.getByLabel('Nombre', { exact: true })
        ).toHaveAttribute('aria-invalid', 'true')
        expect(api.callsTo('POST', `${ADMIN}/products`)).toHaveLength(0)
    })

    test('crea un producto con listas, números e interruptores', async ({
        page,
        api,
    }) => {
        await page.goto('/catalog/products')
        await page.getByRole('button', { name: 'Nuevo producto' }).click()
        const dialog = page.getByRole('dialog', { name: 'Nuevo producto' })

        await dialog
            .getByLabel('Nombre', { exact: true })
            .fill('Melamina blanca 18mm')
        await dialog.getByLabel('SKU').fill('TAB-MEL-18')
        await dialog.getByLabel('Categoría').click()
        await page.getByRole('option', { name: 'Tableros' }).click()
        await dialog.getByLabel('Unidad de Medida').click()
        await page.getByRole('option', { name: 'Metro (m)' }).click()
        await dialog.getByLabel('Precio de venta').fill('18.75')

        const isService = dialog.getByRole('switch', { name: 'Es servicio' })
        await expect(isService).not.toBeChecked()
        await dialog.getByText('Es servicio').click()
        await expect(isService).toBeChecked()

        await dialog.getByRole('button', { name: 'Guardar' }).click()

        await expect(page.getByText('Producto creado')).toBeVisible()
        await expect(dialog).toBeHidden()
        await expect(row(page, 'Melamina blanca 18mm')).toContainText(
            'TAB-MEL-18'
        )
        expect(api.callsTo('POST', `${ADMIN}/products`)[0].body).toMatchObject({
            name: 'Melamina blanca 18mm',
            sku: 'TAB-MEL-18',
            categoryId: 1,
            unitOfMeasureId: 2,
            salePrice: 18.75,
            taxCode: 'VAT_15',
            isActive: true,
            isService: true,
        })
    })

    test('abre la edición con los valores guardados', async ({ page, api }) => {
        await page.goto('/catalog/products')
        await page
            .getByRole('button', { name: 'Editar Tablero MDF 15mm' })
            .click()
        const dialog = page.getByRole('dialog', { name: 'Editar producto' })

        await expect(dialog.getByLabel('SKU')).toHaveValue('TAB-MDF-15')
        await expect(dialog.getByLabel('Precio de venta')).toHaveValue('12.5')
        await expect(dialog).toContainText('Tableros')

        await dialog.getByLabel('Precio de venta').fill('13.9')
        await dialog.getByRole('button', { name: 'Guardar' }).click()

        await expect(page.getByText('Producto actualizado')).toBeVisible()
        expect(
            api.callsTo('PUT', `${ADMIN}/products/:id`)[0].body
        ).toMatchObject({ salePrice: 13.9, sku: 'TAB-MDF-15' })
    })

    test('se puede recorrer y cerrar el formulario con el teclado', async ({
        page,
    }) => {
        await page.goto('/catalog/products')
        const open = page.getByRole('button', { name: 'Nuevo producto' })
        await open.focus()
        await page.keyboard.press('Enter')
        const dialog = page.getByRole('dialog', { name: 'Nuevo producto' })
        await expect(dialog).toBeVisible()

        await page.keyboard.press('Escape')

        await expect(dialog).toBeHidden()
    })
})
