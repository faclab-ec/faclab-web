import { test, expect } from '../support/test'
import { mockEmptyBackend } from '../fixtures/backend'
import { mockImports } from '../fixtures/imports'
import { ADMIN } from '../support/mockApi'

test.describe('Importación masiva', () => {
    test.beforeEach(async ({ api, signIn }) => {
        mockEmptyBackend(api)
        mockImports(api)
        await signIn()
    })

    test('un archivo con errores muestra el detalle por fila y no se importa', async ({
        page,
        api,
    }) => {
        await page.goto('/settings/imports')
        await expect(
            page.getByRole('heading', { name: 'Importar datos', exact: true })
        ).toBeVisible()
        await expect(
            page.getByText('Código interno del producto, único en la empresa')
        ).toBeVisible()

        const [template] = await Promise.all([
            page.waitForEvent('download'),
            page.getByRole('button', { name: 'Plantilla Excel' }).click(),
        ])
        expect(template.suggestedFilename()).toBe('plantilla-productos.xlsx')

        await page.getByLabel('Archivo a importar').setInputFiles({
            name: 'productos-con-errores.csv',
            mimeType: 'text/csv',
            buffer: Buffer.from('sku,unidad\nTOR-1,und\nPAL-1,kg\n'),
        })
        await page.getByRole('button', { name: 'Validar archivo' }).click()

        await expect(page).toHaveURL(/\/settings\/imports\/1$/)
        await expect(page.getByText('El archivo tiene errores')).toBeVisible()
        const row = page
            .getByRole('row')
            .filter({ hasText: 'No existe la unidad kg' })
        await expect(row).toContainText('4')
        await expect(
            page.getByRole('button', { name: 'Confirmar importación' })
        ).toHaveCount(0)
        const [report] = await Promise.all([
            page.waitForEvent('download'),
            page.getByRole('button', { name: 'Descargar errores' }).click(),
        ])
        expect(report.suggestedFilename()).toBe('errores-importacion-1.xlsx')

        const [upload] = api.callsTo('POST', `${ADMIN}/imports`)
        expect(upload.headers['content-type']).toMatch(/multipart\/form-data/)
        expect(String(upload.body)).toContain('name="kind"')
        expect(
            api.callsTo('POST', `${ADMIN}/imports/:id/confirm`)
        ).toHaveLength(0)
    })

    test('un archivo válido se confirma y muestra su avance hasta completarse', async ({
        page,
        api,
    }) => {
        await page.goto('/settings/imports')
        await page.getByLabel('Archivo a importar').setInputFiles({
            name: 'productos.csv',
            mimeType: 'text/csv',
            buffer: Buffer.from('sku,unidad\nTOR-1,und\nCEM-1,und\n'),
        })
        await page.getByRole('button', { name: 'Validar archivo' }).click()

        await expect(page.getByText('Listo para importar')).toBeVisible()
        await page
            .getByRole('button', { name: 'Confirmar importación' })
            .click()
        const dialog = page.getByRole('dialog')
        await expect(dialog).toContainText('Se crearán 2 filas')
        await dialog.getByRole('button', { name: 'Importar' }).click()

        await expect(page.getByText('Importando: 1 de 2 filas.')).toBeVisible()
        await expect(
            page.getByRole('progressbar', { name: 'Avance de la importación' })
        ).toHaveAttribute('aria-valuenow', '50')
        await expect(page.getByText('Importación completada')).toBeVisible({
            timeout: 10_000,
        })
        expect(
            api.callsTo('POST', `${ADMIN}/imports/:id/confirm`)
        ).toHaveLength(1)

        await page.getByRole('button', { name: 'Volver' }).click()
        const listed = page
            .getByRole('row')
            .filter({ hasText: 'productos.csv' })
        await expect(listed).toContainText('Completada')
    })
})
