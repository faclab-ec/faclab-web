import { test, expect } from '../support/test'
import { mockEmptyBackend } from '../fixtures/backend'
import { stuckInvoice } from '../fixtures/invoicing'
import { buildDiscrepancy, buildSale } from '../fixtures/sales'
import { ADMIN, INVOICING, ok, paginated } from '../support/mockApi'
import { ROLE } from '@/constants/roles.constant'
import type { InvoiceDiscrepancy } from '@features/sales'

const ATTENTION = '/sales/attention'
const BY_SALE = `${INVOICING}/invoices/by-sale/:saleId`

test.describe('Ventas que requieren atención', () => {
    test('reenvía una venta que facturación nunca recibió', async ({
        page,
        api,
        signIn,
    }) => {
        mockEmptyBackend(api)
        await signIn()
        let open: InvoiceDiscrepancy[] = [buildDiscrepancy()]
        api.get(`${ADMIN}/invoice-discrepancies`, ({ query }) =>
            paginated(open, query)
        )
        api.get(BY_SALE, () => ok([]))
        api.post(`${ADMIN}/sales/:id/request-invoice`, () => {
            // The resend resolves it in core
            open = []
            return ok(buildSale())
        })

        await page.goto(ATTENTION)

        const row = page.getByRole('row').filter({ hasText: 'V-001-000501' })
        await expect(row).toContainText('Sin resultado de facturación')
        await expect(row).toContainText('No recibió la venta')
        await row.getByRole('button', { name: 'Reenviar' }).click()

        await expect(
            page.getByText('Venta reenviada a facturación')
        ).toBeVisible()
        await expect(row).toHaveCount(0)
        expect(
            api.callsTo('POST', `${ADMIN}/sales/:id/request-invoice`)[0].params
                .id
        ).toBe('501')
    })

    test('reintenta en facturación la factura que sigue detenida', async ({
        page,
        api,
        signIn,
    }) => {
        mockEmptyBackend(api)
        await signIn()
        api.get(`${ADMIN}/invoice-discrepancies`, ({ query }) =>
            paginated([buildDiscrepancy()], query)
        )
        api.get(BY_SALE, () => ok([stuckInvoice()]))

        await page.goto(ATTENTION)

        const row = page.getByRole('row').filter({ hasText: 'V-001-000501' })
        await expect(row).toContainText('El SRI no respondió')
        await expect(
            row.getByRole('button', { name: 'Reintentar en facturación' })
        ).toBeVisible()
        await expect(row.getByRole('button', { name: 'Reenviar' })).toHaveCount(
            0
        )
    })

    test('marca revisada una discrepancia con su nota', async ({
        page,
        api,
        signIn,
    }) => {
        mockEmptyBackend(api)
        await signIn()
        const cancelled = buildDiscrepancy({
            kind: 'authorized_on_cancelled',
            invoiceId: 'inv-9',
            sale: { ...buildDiscrepancy().sale!, status: 'CANCELLED' },
        })
        let open: InvoiceDiscrepancy[] = [cancelled]
        api.get(`${ADMIN}/invoice-discrepancies`, ({ query }) =>
            paginated(open, query)
        )
        api.get(BY_SALE, () => ok([]))
        api.post(`${ADMIN}/invoice-discrepancies/:id/review`, ({ body }) => {
            open = []
            const { note } = body as { note: string | null }
            return ok({ ...cancelled, status: 'reviewed', reviewNote: note })
        })

        await page.goto(ATTENTION)
        const row = page.getByRole('row').filter({ hasText: 'V-001-000501' })
        await expect(row).toContainText('Factura autorizada de venta anulada')
        // A cancelled sale isn't resent: it needs a credit note
        await expect(row.getByRole('button', { name: 'Reenviar' })).toHaveCount(
            0
        )
        await row.getByRole('button', { name: 'Marcar revisada' }).click()
        const dialog = page.getByRole('dialog')
        await dialog.getByLabel('Nota').fill('Se emitirá nota de crédito')
        await dialog.getByRole('button', { name: 'Marcar revisada' }).click()

        await expect(
            page.getByText('Discrepancia marcada como revisada')
        ).toBeVisible()
        expect(
            api.callsTo('POST', `${ADMIN}/invoice-discrepancies/:id/review`)[0]
                .body
        ).toEqual({ note: 'Se emitirá nota de crédito' })
    })

    test('lista las ventas rechazadas por el SRI con su motivo', async ({
        page,
        api,
        signIn,
    }) => {
        mockEmptyBackend(api)
        await signIn({ role: ROLE.VIEWER })
        api.get(`${ADMIN}/sales`, ({ query }) =>
            paginated(
                query.get('invoiceStatus') === 'REJECTED'
                    ? [
                          buildSale({
                              invoiceStatus: 'REJECTED',
                              invoiceRejectionReason:
                                  'IDENTIFICACION DEL COMPRADOR INVALIDA',
                          }),
                      ]
                    : [],
                query
            )
        )

        await page.goto(ATTENTION)
        await page.getByRole('tab', { name: 'Rechazadas por el SRI' }).click()

        const row = page.getByRole('row').filter({ hasText: 'V-001-000501' })
        await expect(row).toContainText('IDENTIFICACION DEL COMPRADOR INVALIDA')
        // A viewer reads but doesn't resend
        await expect(row.getByRole('button', { name: 'Reenviar' })).toHaveCount(
            0
        )
    })
})
