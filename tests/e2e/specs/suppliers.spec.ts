import { test, expect } from '../support/test'
import { mockSuppliers, supplierList } from '../fixtures/suppliers'
import { ADMIN, apiError, paginated } from '../support/mockApi'
import type { Page } from '@playwright/test'

const row = (page: Page, name: string) =>
    page.getByRole('row').filter({ hasText: name })

const openCreateDialog = async (page: Page) => {
    await page.getByRole('button', { name: 'Nuevo proveedor' }).click()
    const dialog = page.getByRole('dialog', { name: 'Nuevo proveedor' })
    await expect(dialog).toBeVisible()
    return dialog
}

test.describe('Proveedores', () => {
    test.beforeEach(async ({ signIn }) => {
        await signIn()
    })

    test('lista los proveedores con su estado', async ({ page, api }) => {
        mockSuppliers(api)
        await page.goto('/suppliers')

        await expect(row(page, 'Maderas del Austro')).toContainText('Activo')
        await expect(row(page, 'Maderas del Austro')).toContainText(
            '0190123456001'
        )
        await expect(row(page, 'Tableros del Pacífico')).toContainText(
            'Inactivo'
        )
        // Cabecera + 3 proveedores
        await expect(page.getByRole('row')).toHaveCount(4)
    })

    test('busca en el servidor por nombre o identificación', async ({
        page,
        api,
    }) => {
        mockSuppliers(api)
        await page.goto('/suppliers')
        await expect(row(page, 'Maderas del Austro')).toBeVisible()

        await page
            .getByPlaceholder('Buscar por nombre o identificación')
            .fill('herr')

        await expect(row(page, 'Herrajes Andinos')).toBeVisible()
        await expect(row(page, 'Maderas del Austro')).toHaveCount(0)
        const searches = api
            .callsTo('GET', `${ADMIN}/suppliers`)
            .map((call) => call.query.get('search'))
        expect(searches).toContain('herr')
    })

    test('valida los campos obligatorios antes de crear', async ({
        page,
        api,
    }) => {
        mockSuppliers(api)
        await page.goto('/suppliers')
        const dialog = await openCreateDialog(page)

        await dialog.getByRole('button', { name: 'Guardar' }).click()

        await expect(dialog.getByText('Nombre requerido')).toBeVisible()
        await expect(dialog.getByText('Identificación requerida')).toBeVisible()
        expect(api.callsTo('POST', `${ADMIN}/suppliers`)).toHaveLength(0)
    })

    test('rechaza un correo con formato inválido', async ({ page, api }) => {
        mockSuppliers(api)
        await page.goto('/suppliers')
        const dialog = await openCreateDialog(page)

        await dialog.getByLabel('Nombre', { exact: true }).fill('Vidrios Sur')
        await dialog
            .getByLabel('Identificación', { exact: true })
            .fill('0102030405001')
        await dialog.getByLabel('Email').fill('no-es-un-correo')
        await dialog.getByRole('button', { name: 'Guardar' }).click()

        // El campo es `type="email"`: el navegador lo marca inválido y no deja
        // enviar el formulario.
        await expect(dialog.getByLabel('Email')).toHaveJSProperty(
            'validity.typeMismatch',
            true
        )
        await expect(dialog).toBeVisible()
        expect(api.callsTo('POST', `${ADMIN}/suppliers`)).toHaveLength(0)
    })

    test('crea un proveedor y lo muestra en la lista', async ({
        page,
        api,
    }) => {
        mockSuppliers(api)
        await page.goto('/suppliers')
        const dialog = await openCreateDialog(page)

        await dialog.getByLabel('Nombre', { exact: true }).fill('Vidrios Sur')
        await dialog
            .getByLabel('Identificación', { exact: true })
            .fill('0102030405')
        await dialog.getByLabel('Tipo de identificación').click()
        await page.getByRole('option', { name: 'Cédula' }).click()
        await dialog.getByLabel('Email').fill('ventas@vidriossur.ec')
        await dialog.getByLabel('Ciudad').fill('Loja')
        await dialog.getByRole('button', { name: 'Guardar' }).click()

        await expect(page.getByText('Proveedor creado')).toBeVisible()
        await expect(dialog).toBeHidden()
        await expect(row(page, 'Vidrios Sur')).toContainText('Loja')

        expect(api.callsTo('POST', `${ADMIN}/suppliers`)[0].body).toMatchObject(
            {
                name: 'Vidrios Sur',
                taxId: '0102030405',
                taxType: 2,
                email: 'ventas@vidriossur.ec',
                city: 'Loja',
                isActive: true,
            }
        )
    })

    test('muestra el error del servidor y conserva el formulario', async ({
        page,
        api,
    }) => {
        mockSuppliers(api)
        api.post(`${ADMIN}/suppliers`, () =>
            apiError(
                409,
                'VALIDATION_ERROR',
                'Ya existe un proveedor con esa identificación'
            )
        )
        await page.goto('/suppliers')
        const dialog = await openCreateDialog(page)

        await dialog.getByLabel('Nombre', { exact: true }).fill('Duplicado')
        await dialog
            .getByLabel('Identificación', { exact: true })
            .fill('0190123456001')
        await dialog.getByRole('button', { name: 'Guardar' }).click()

        await expect(
            page.getByText('Ya existe un proveedor con esa identificación')
        ).toBeVisible()
        await expect(dialog).toBeVisible()
        await expect(dialog.getByLabel('Nombre', { exact: true })).toHaveValue(
            'Duplicado'
        )
    })

    test('edita un proveedor existente', async ({ page, api }) => {
        mockSuppliers(api)
        await page.goto('/suppliers')

        await page
            .getByRole('button', { name: 'Editar Herrajes Andinos' })
            .click()
        const dialog = page.getByRole('dialog', { name: 'Editar proveedor' })
        await expect(dialog.getByLabel('Nombre', { exact: true })).toHaveValue(
            'Herrajes Andinos'
        )

        await dialog.getByLabel('Ciudad').fill('Ambato')
        await dialog.getByRole('button', { name: 'Guardar' }).click()

        await expect(page.getByText('Proveedor actualizado')).toBeVisible()
        await expect(row(page, 'Herrajes Andinos')).toContainText('Ambato')
        expect(api.callsTo('PUT', `${ADMIN}/suppliers/:id`)[0].params.id).toBe(
            '2'
        )
    })

    test('desactiva y vuelve a activar un proveedor', async ({ page, api }) => {
        mockSuppliers(api)
        await page.goto('/suppliers')

        await page
            .getByRole('button', { name: 'Desactivar Maderas del Austro' })
            .click()
        await expect(row(page, 'Maderas del Austro')).toContainText('Inactivo')

        await page
            .getByRole('button', { name: 'Activar Maderas del Austro' })
            .click()
        await expect(row(page, 'Maderas del Austro')).not.toContainText(
            'Inactivo'
        )
        expect(
            api.callsTo('POST', `${ADMIN}/suppliers/:id/deactivate`)
        ).toHaveLength(1)
        expect(
            api.callsTo('POST', `${ADMIN}/suppliers/:id/activate`)
        ).toHaveLength(1)
    })

    test('pide confirmación antes de eliminar', async ({ page, api }) => {
        mockSuppliers(api)
        await page.goto('/suppliers')

        await page
            .getByRole('button', { name: 'Eliminar Herrajes Andinos' })
            .click()
        const confirm = page.getByRole('dialog')
        await expect(confirm).toContainText('¿Eliminar "Herrajes Andinos"?')

        // Cancelar no borra nada
        await confirm.getByRole('button', { name: 'Cancelar' }).click()
        await expect(confirm).toBeHidden()
        expect(api.callsTo('DELETE', `${ADMIN}/suppliers/:id`)).toHaveLength(0)

        await page
            .getByRole('button', { name: 'Eliminar Herrajes Andinos' })
            .click()
        await page
            .getByRole('dialog')
            .getByRole('button', { name: 'Eliminar' })
            .click()

        await expect(page.getByText('Proveedor eliminado')).toBeVisible()
        await expect(row(page, 'Herrajes Andinos')).toHaveCount(0)
    })

    test('abre el detalle de un proveedor y vuelve a la lista', async ({
        page,
        api,
    }) => {
        mockSuppliers(api)
        await page.goto('/suppliers')

        await page
            .getByRole('button', { name: 'Ver Maderas del Austro' })
            .click()

        await expect(page).toHaveURL(/\/suppliers\/1$/)
        await expect(
            page.getByRole('heading', { name: 'Maderas del Austro' })
        ).toBeVisible()
        await expect(page.getByText('0190123456001')).toBeVisible()
        await expect(
            page.getByRole('tab', { name: 'Contactos' })
        ).toHaveAttribute('aria-selected', 'true')

        await page.getByRole('tab', { name: 'Productos' }).click()
        await expect(
            page.getByRole('tab', { name: 'Productos' })
        ).toHaveAttribute('aria-selected', 'true')

        await page.getByRole('button', { name: 'Volver' }).click()
        await expect(page).toHaveURL(/\/suppliers$/)
    })

    test('un proveedor inexistente muestra "no encontrado"', async ({
        page,
        api,
    }) => {
        mockSuppliers(api)
        await page.goto('/suppliers/999')

        await expect(page.getByText('Proveedor no encontrado')).toBeVisible()
        await page.getByRole('button', { name: 'Volver a Proveedores' }).click()
        await expect(page).toHaveURL(/\/suppliers$/)
    })

    test('pagina en el servidor', async ({ page, api }) => {
        const many = Array.from({ length: 23 }, (_, index) => ({
            ...supplierList()[0],
            id: index + 1,
            name: `Proveedor ${String(index + 1).padStart(2, '0')}`,
        }))
        mockSuppliers(api, many)
        await page.goto('/suppliers')
        await expect(row(page, 'Proveedor 01')).toBeVisible()
        await expect(row(page, 'Proveedor 11')).toHaveCount(0)

        await page.getByRole('button', { name: 'Página 2' }).click()

        await expect(row(page, 'Proveedor 11')).toBeVisible()
        await expect(row(page, 'Proveedor 01')).toHaveCount(0)
        const offsets = api
            .callsTo('GET', `${ADMIN}/suppliers`)
            .map((call) => call.query.get('offset'))
        expect(offsets).toContain('10')
    })

    test('sin proveedores muestra el estado vacío', async ({ page, api }) => {
        mockSuppliers(api, [])
        await page.goto('/suppliers')

        await expect(
            page.getByText('No hay registros para mostrar')
        ).toBeVisible()
    })

    test('si la carga falla lo dice y permite reintentar', async ({
        page,
        api,
    }) => {
        let failing = true
        api.get(`${ADMIN}/suppliers`, ({ query }) =>
            failing
                ? apiError(500, 'INTERNAL_ERROR', 'Error interno del servidor')
                : paginated(supplierList(), query)
        )
        await page.goto('/suppliers')

        await expect(
            page.getByText('No se pudo cargar la información')
        ).toBeVisible()

        failing = false
        await page.getByRole('button', { name: 'Reintentar' }).click()

        await expect(row(page, 'Maderas del Austro')).toBeVisible()
    })
})
