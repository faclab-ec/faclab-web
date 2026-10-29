import { test, expect } from '../support/test'
import { mockEmptyBackend } from '../fixtures/backend'
import { buildBranch } from '../fixtures/organization'
import { ADMIN, paginated } from '../support/mockApi'
import type { AuditEntry } from '@features/audit-log'

const priceChange: AuditEntry = {
    id: 2,
    occurredAt: '2026-10-28T09:30:00',
    actorUserId: 1,
    actorName: 'Admin Uno',
    action: 'product.price_changed',
    resourceType: 'product',
    resourceId: 10,
    branchId: 1,
    source: 'request',
    requestId: '6f1c3d1e-6b1a-4a43-9d0e-6a7f2f6b9e51',
    before: { sale_price: '10.000000' },
    after: { sale_price: '12.500000' },
}

const cancellation: AuditEntry = {
    id: 1,
    occurredAt: '2026-10-28T09:00:00',
    actorUserId: 3,
    actorName: 'Caja Uno',
    action: 'sale.cancelled',
    resourceType: 'sale',
    resourceId: 41,
    branchId: 1,
    source: 'request',
    requestId: null,
    before: { status: 'CONFIRMED', total: '11.500000' },
    after: { status: 'CANCELLED', reason: 'Error de cobro' },
}

test.describe('Bitácora de auditoría', () => {
    test('filtra por acción y muestra el detalle de una entrada', async ({
        page,
        api,
        signIn,
    }) => {
        mockEmptyBackend(api)
        await signIn()
        api.get(`${ADMIN}/branches`, ({ query }) =>
            paginated([buildBranch()], query)
        )
        api.get(`${ADMIN}/audit-log`, ({ query }) => {
            const action = query.get('action')
            const entries = [priceChange, cancellation].filter(
                (entry) => !action || entry.action === action
            )
            return paginated(entries, query)
        })

        await page.goto('/settings/audit-log')
        const rows = page.getByRole('main').getByRole('row')
        await expect(rows.filter({ hasText: 'Precio cambiado' })).toBeVisible()
        await expect(rows.filter({ hasText: 'Venta anulada' })).toBeVisible()

        await page.getByRole('main').getByLabel('Acción').focus()
        await page.keyboard.press('ArrowDown')
        await page.getByRole('option', { name: 'Venta anulada' }).click()

        await expect(rows.filter({ hasText: 'Precio cambiado' })).toHaveCount(0)
        const lastCall = api.callsTo('GET', `${ADMIN}/audit-log`).at(-1)
        expect(lastCall?.query.get('action')).toBe('sale.cancelled')
        expect(lastCall?.query.get('offset')).toBe('0')

        await rows
            .filter({ hasText: 'Venta anulada' })
            .getByRole('button', { name: 'Ver detalle' })
            .click()
        const dialog = page.getByRole('dialog')
        await expect(dialog.getByText('Caja Uno')).toBeVisible()
        await expect(dialog.getByText('Venta #41')).toBeVisible()
        const reason = dialog.getByRole('row', { name: /Motivo/ })
        await expect(reason).toContainText('—')
        await expect(reason).toContainText('Error de cobro')
        const status = dialog.getByRole('row', { name: /Estado/ })
        await expect(status).toContainText('CONFIRMED')
        await expect(status).toContainText('CANCELLED')
    })
})
