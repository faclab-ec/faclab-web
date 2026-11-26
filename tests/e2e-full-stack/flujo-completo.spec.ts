import { readFile } from 'node:fs/promises'
import {
    expect,
    test,
    type Locator,
    type Page,
    type Response,
} from '@playwright/test'
import { Api, type InvoiceDocument } from './api'
import { SEED, env } from './env'

// Una caja de 25 al precio de la lista Mayorista del cliente (3,80 por unidad),
// no al de la presentación (100,00), más IVA 15 %
const NET = '95.00'
const TOTAL = '109.25'
const TOTAL_LABEL = '$109,25'
const OPENING_BALANCE = '50'

// Kafka, la cola de invoicing y un reintento del SRI a un minuto
const DOCUMENT_TIMEOUT = 4 * 60_000

let api: Api

test.beforeAll(async () => {
    api = await Api.signIn()
})

test.afterAll(async () => {
    await api?.dispose()
})

const apiCall = (page: Page, method: string, path: RegExp) =>
    page.waitForResponse(
        (response: Response) =>
            response.request().method() === method &&
            path.test(new URL(response.url()).pathname)
    )

/** El número del documento, como lo muestra la web: 001-001-000000001 */
const documentNumber = ({ accessCode }: InvoiceDocument) =>
    `${accessCode!.slice(24, 27)}-${accessCode!.slice(
        27,
        30
    )}-${accessCode!.slice(30, 39)}`

const documentOfType = async (saleId: number, docType: string) => {
    const documents = await api.documentsOfSale(saleId)
    const document = documents.find((d) => d.docType === docType)
    if (!document) throw new Error(`La venta no tiene el documento ${docType}`)
    return document
}

/** Espera el resultado que faclab-core aplica a la venta */
const waitForInvoiceStatus = (saleId: number, status: string) =>
    expect
        .poll(async () => (await api.sale(saleId)).invoiceStatus, {
            message: `la venta ${saleId} no llegó a ${status}`,
            timeout: DOCUMENT_TIMEOUT,
            intervals: [1_000, 2_000, 5_000],
        })
        .toBe(status)

const downloadPdf = async (page: Page, button: Locator, name: string) => {
    const [download] = await Promise.all([
        page.waitForEvent('download'),
        button.click(),
    ])
    expect(download.suggestedFilename()).toBe(`${name}.pdf`)
    const content = await readFile(await download.path())
    expect(content.subarray(0, 5).toString()).toBe('%PDF-')
}

test('del turno a la conciliación', async ({ page }) => {
    let saleId = 0

    await test.step('inicia sesión eligiendo la empresa', async () => {
        await page.goto('/sign-in')
        await page.getByLabel('Usuario', { exact: true }).fill(env.username)
        await page.getByLabel('Contraseña', { exact: true }).fill(env.password)
        await page.getByRole('button', { name: 'Ingresar' }).click()
        await expect(
            page.getByRole('heading', { name: 'Elige la empresa' })
        ).toBeVisible()
        await page
            .getByRole('list', { name: 'Empresas' })
            .getByRole('button', { name: new RegExp(SEED.company) })
            .click()
        await expect(page).toHaveURL(/\/home$/)
    })

    await test.step('abre el turno de la caja', async () => {
        await page.goto('/pos')
        await expect(
            page.getByRole('main').getByText(SEED.terminal)
        ).toBeVisible()
        await page.getByLabel('Saldo inicial').fill(OPENING_BALANCE)
        await page.getByRole('button', { name: 'Abrir turno' }).click()
        await expect(page.getByText(/Turno #\d+/)).toBeVisible()
    })

    await test.step('vende una caja con la lista de precios del cliente', async () => {
        await page
            .getByRole('searchbox', { name: 'Buscar productos' })
            .fill(SEED.product.sku)
        const products = page.getByRole('region', { name: 'Productos' })
        const card = products.getByRole('button', {
            name: new RegExp(SEED.product.name),
        })
        // La búsqueda llega con retardo y repinta la grilla: se espera a que
        // quede una sola tarjeta (las categorías no muestran precio)
        await expect(
            products.getByRole('button').filter({ hasText: '$' })
        ).toHaveCount(1)
        await card.click()
        await page
            .getByRole('dialog', {
                name: `Presentación de ${SEED.product.name}`,
            })
            .getByRole('button', { name: new RegExp(SEED.presentation) })
            .click()

        const order = page.getByRole('complementary', { name: 'Orden' })
        await order.getByRole('button', { name: 'Buscar' }).click()
        const search = page
            .getByRole('dialog')
            .filter({ hasText: 'Buscar Cliente' })
        await search.getByLabel('RUC / Cedula').fill(SEED.customer.taxId)
        await search.getByRole('button', { name: 'Seleccionar' }).click()
        await expect(order.getByText(SEED.customer.name)).toBeVisible()
        await expect(order).toContainText(TOTAL_LABEL)

        await order.getByRole('button', { name: 'Cobrar' }).click()
        const payment = page.getByRole('dialog', { name: 'Cobrar' })
        await expect(payment).toContainText(TOTAL_LABEL)
        const created = apiCall(page, 'POST', /\/api\/pos\/sales\/quick$/)
        await payment.getByRole('button', { name: 'Completar venta' }).click()
        saleId = (await (await created).json()).data.id

        const receipt = page.getByRole('dialog', { name: 'Venta completada' })
        await expect(receipt).toContainText(SEED.presentation)
        await expect(receipt).toContainText(TOTAL_LABEL)
        // El de texto; la X de la esquina también se llama "Cerrar"
        await receipt
            .getByRole('button', { name: 'Cerrar' })
            .filter({ hasText: 'Cerrar' })
            .click()
    })

    await test.step('el SRI autoriza la factura y se descarga su RIDE', async () => {
        await waitForInvoiceStatus(saleId, 'AUTHORIZED')
        const invoice = await documentOfType(saleId, '01')
        expect(invoice.status).toBe('authorized')
        const xml = await api.documentXml(invoice.id)
        expect(xml).toContain(`<totalSinImpuestos>${NET}</totalSinImpuestos>`)
        expect(xml).toContain(`<importeTotal>${TOTAL}</importeTotal>`)

        await page.goto('/invoices')
        const row = page
            .getByRole('row')
            .filter({ hasText: documentNumber(invoice) })
        await expect(row).toContainText(`#${saleId}`)
        await downloadPdf(
            page,
            row.getByRole('button', { name: 'Descargar RIDE' }),
            invoice.accessCode!
        )
    })

    await test.step('devuelve la venta con nota de crédito', async () => {
        await page.goto('/pos')
        await page.getByRole('button', { name: 'Devolución' }).click()
        const dialog = page.getByRole('dialog')
        await dialog.getByPlaceholder('# de venta').fill(String(saleId))
        await dialog.getByRole('button', { name: 'Buscar' }).click()
        await dialog
            .getByRole('button', { name: 'Anular venta (devolver todo)' })
            .click()
        await dialog
            .getByPlaceholder('Motivo (obligatorio: va en la nota de crédito)')
            .fill('Prueba de punta a punta')
        await dialog.getByRole('button', { name: 'Continuar' }).click()
        await dialog
            .getByRole('button', { name: 'Procesar Devolución' })
            .click()
        await expect(
            page.getByText('Devolución procesada correctamente')
        ).toBeVisible()

        await waitForInvoiceStatus(saleId, 'CREDITED')
        const note = await documentOfType(saleId, '04')
        expect(note.status).toBe('authorized')
        expect(await api.documentXml(note.id)).toContain(
            `<valorModificacion>${TOTAL}</valorModificacion>`
        )

        await page.goto('/refunds')
        await downloadPdf(
            page,
            page.getByRole('button', {
                name: 'Descargar RIDE de la nota de crédito',
            }),
            note.accessCode!
        )
    })

    await test.step('cierra la caja sin diferencias', async () => {
        await page.goto('/pos')
        await page
            .getByRole('button', { name: 'Cerrar turno', exact: true })
            .click()
        const dialog = page.getByRole('dialog', { name: 'Cerrar turno' })
        // Lo cobrado se devolvió: en la caja queda el saldo inicial
        await dialog.getByLabel('Efectivo contado').fill(OPENING_BALANCE)
        await expect(dialog.getByTestId('count-CASH')).toContainText('$0,00')
        const closed = apiCall(page, 'POST', /\/api\/pos\/shifts\/\d+\/close$/)
        await dialog
            .getByRole('button', { name: 'Cerrar Turno', exact: true })
            .click()
        const shift = (await (await closed).json()).data
        expect(shift.discrepancy).toBe(0)
        expect(shift.closingNumber).toMatch(/^Z-001-CAJA-01-\d{6}$/)
        await expect(page).toHaveURL(/\/home$/)
    })

    await test.step('la conciliación no encuentra discrepancias', async () => {
        // La semilla trae ventas confirmadas que nunca se enviaron a facturar:
        // la conciliación las lista, con razón. De las enviadas, ninguna
        const discrepancies = await api.openDiscrepancies()
        expect(
            discrepancies.filter(
                (d) => d.saleId === saleId || d.sale.invoiceRequestedAt
            )
        ).toEqual([])
        const documents = await api.documentsOfSale(saleId)
        expect(documents.map((d) => [d.docType, d.status]).sort()).toEqual([
            ['01', 'authorized'],
            ['04', 'authorized'],
        ])
        expect((await api.sale(saleId)).total).toBe(Number(TOTAL))
        expect(await api.invoicingStatus()).toMatchObject({
            pendingInvoices: 0,
            invoicesWithIssues: 0,
        })
    })
})
