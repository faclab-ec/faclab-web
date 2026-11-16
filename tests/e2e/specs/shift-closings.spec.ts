import { test, expect } from '../support/test'
import { mockEmptyBackend } from '../fixtures/backend'
import { openShift } from '../fixtures/pos'
import { POS, ok, paginated } from '../support/mockApi'
import type { ZReport } from '@features/pos'

const closed = openShift({
    status: 'CLOSED',
    closedAt: '2026-01-15T22:00:00.000Z',
    closedBy: 'Ana',
    closingBalance: 75,
    expectedBalance: 80,
    discrepancy: -5,
    closingNumber: 'Z-001-CAJA-01-000007',
})

/** El reporte Z que faclab-core guardó al cerrar (S5.9) */
const zReport = (): ZReport => ({
    shift: {
        id: closed.id,
        cashierName: 'Ana',
        openedAt: closed.openedAt,
        status: 'CLOSED',
    },
    salesSummary: {
        count: 2,
        subtotal: 60.87,
        tax: 9.13,
        discount: 0,
        total: 70,
    },
    paymentsByMethod: [
        { paymentMethod: 'CASH', count: 1, total: 30 },
        { paymentMethod: 'CREDIT_CARD', count: 1, total: 40 },
    ],
    customerPaymentsByMethod: [],
    itemsSold: [
        { productName: 'Martillo', sku: 'MAR-01', quantity: 2, total: 70 },
    ],
    refundSummary: { count: 0, total: 0 },
    cashReconciliation: {
        openingBalance: 50,
        cashSales: 30,
        cashRefunds: 0,
        customerPayments: 0,
        cashIn: 0,
        cashOut: 0,
        expectedBalance: 80,
        closingBalance: 75,
        discrepancy: -5,
    },
    closing: {
        id: 3,
        number: 'Z-001-CAJA-01-000007',
        closedAt: '2026-01-15T22:00:00.000Z',
        closedBy: 'Ana',
        justificationThreshold: 1,
        notes: null,
        counts: [
            {
                paymentMethod: 'CASH',
                expected: 80,
                counted: 75,
                difference: -5,
                justification: 'Billete falso retirado',
            },
            {
                paymentMethod: 'CREDIT_CARD',
                expected: 40,
                counted: 40,
                difference: 0,
                justification: null,
            },
        ],
    },
})

test.describe('Cierres de caja (S5.9)', () => {
    test('la lista de turnos muestra el cierre Z y su detalle el arqueo guardado', async ({
        page,
        api,
        signIn,
    }) => {
        mockEmptyBackend(api)
        await signIn()
        api.get(`${POS}/shifts`, ({ query }) => paginated([closed], query))
        api.get(`${POS}/shifts/:id`, () => ok(closed))
        api.get(`${POS}/reports/z-report`, () => ok(zReport()))

        await page.goto('/shifts')
        const row = page
            .getByRole('main')
            .getByRole('row')
            .filter({ hasText: 'Z-001-CAJA-01-000007' })
        await expect(row).toBeVisible()
        await row
            .getByRole('button', { name: `Ver turno ${closed.id}` })
            .click()

        const main = page.getByRole('main')
        await expect(
            main.getByRole('heading', {
                name: 'Arqueo del cierre Z-001-CAJA-01-000007',
            })
        ).toBeVisible()
        // La diferencia del efectivo con su justificación, como se guardó
        await expect(
            main.getByRole('row').filter({ hasText: 'Billete falso retirado' })
        ).toContainText('Efectivo')
        await expect(main.getByText('Cerrado por')).toBeVisible()
        await expect(
            main.getByText('Guardado al cerrar el turno')
        ).toBeVisible()
    })
})
