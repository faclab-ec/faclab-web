import { test, expect } from '../support/test'
import { mockPOS } from '../fixtures/pos'
import { POS, apiError, ok } from '../support/mockApi'
import { ROLE } from '@/constants/roles.constant'
import type { Page } from '@playwright/test'

const product = (page: Page, name: string) =>
    page
        .getByRole('region', { name: 'Productos' })
        .getByRole('button', { name: new RegExp(name) })

const order = (page: Page) => page.getByRole('complementary', { name: 'Orden' })

test.describe('Punto de venta', () => {
    test.beforeEach(async ({ signIn }) => {
        await signIn({ role: ROLE.CASHIER, username: 'caja1' })
    })

    test('sin turno activo pide abrirlo y valida el formulario', async ({
        page,
        api,
    }) => {
        mockPOS(api, null)
        await page.goto('/pos')

        await expect(
            page.getByRole('heading', { name: 'Abrir turno' })
        ).toBeVisible()
        // Viene precargado con el usuario de la sesión
        const cashier = page.getByLabel('Nombre del cajero')
        await expect(cashier).toHaveValue('caja1')
        await cashier.clear()
        await page.getByRole('button', { name: 'Abrir turno' }).click()

        await expect(cashier).toHaveAttribute('aria-invalid', 'true')
        expect(api.callsTo('POST', `${POS}/shifts/open`)).toHaveLength(0)
    })

    test('abre un turno y entra al punto de venta', async ({ page, api }) => {
        mockPOS(api, null)
        let opened = false
        api.get(`${POS}/shifts/active`, () =>
            ok(
                opened
                    ? {
                          id: 7,
                          cashierName: 'Luis',
                          openedAt: '2026-01-15T13:00:00.000Z',
                          closedAt: null,
                          openingBalance: 80,
                          closingBalance: null,
                          expectedBalance: null,
                          discrepancy: null,
                          status: 'OPEN',
                          notes: null,
                      }
                    : null
            )
        )
        api.post(`${POS}/shifts/open`, ({ body }) => {
            opened = true
            return ok({ id: 7, ...(body as object), status: 'OPEN' }, 201)
        })
        await page.goto('/pos')

        await page.getByLabel('Nombre del cajero').fill('Luis')
        await page.getByLabel('Saldo inicial').fill('80')
        await page.getByRole('button', { name: 'Abrir turno' }).click()

        await expect(
            page.getByRole('heading', { name: 'Hola, Luis' })
        ).toBeVisible()
        expect(api.callsTo('POST', `${POS}/shifts/open`)[0].body).toMatchObject(
            { cashierName: 'Luis', openingBalance: 80 }
        )
    })

    test('con el carrito vacío no se puede cobrar', async ({ page, api }) => {
        mockPOS(api)
        await page.goto('/pos')

        await expect(
            page.getByRole('heading', { name: 'Hola, Ana' })
        ).toBeVisible()
        await expect(page.getByText('Turno #42')).toBeVisible()
        await expect(order(page).getByText('Carrito vacío')).toBeVisible()
        await expect(
            order(page).getByRole('button', { name: 'Cobrar' })
        ).toBeDisabled()
        await expect(
            order(page).getByRole('button', { name: 'Retener' })
        ).toBeDisabled()
    })

    test('filtra los productos por categoría y por búsqueda', async ({
        page,
        api,
    }) => {
        mockPOS(api)
        await page.goto('/pos')
        await expect(product(page, 'Tablero MDF 15mm')).toBeVisible()

        const categories = page.getByRole('group', { name: 'Categorías' })
        await categories.getByRole('button', { name: 'Herrajes' }).click()
        await expect(product(page, 'Bisagra cazoleta 35mm')).toBeVisible()
        await expect(product(page, 'Tablero MDF 15mm')).toHaveCount(0)
        await expect(
            categories.getByRole('button', { name: 'Herrajes' })
        ).toHaveAttribute('aria-pressed', 'true')

        await categories.getByRole('button', { name: 'Todos' }).click()
        await page
            .getByRole('searchbox', { name: 'Buscar productos' })
            .fill('tirador')
        await expect(product(page, 'Tirador acero 128mm')).toBeVisible()
        await expect(product(page, 'Bisagra cazoleta 35mm')).toHaveCount(0)
    })

    test('arma la orden y exige consumidor final o cliente para cobrar', async ({
        page,
        api,
    }) => {
        mockPOS(api)
        await page.goto('/pos')

        await product(page, 'Tablero MDF 15mm').click()
        await product(page, 'Tablero MDF 15mm').click()
        await product(page, 'Bisagra cazoleta 35mm').click()

        const panel = order(page)
        await expect(panel.getByLabel('Cantidad: 2')).toBeVisible()
        await expect(panel.getByText('Bisagra cazoleta 35mm')).toBeVisible()

        const pay = panel.getByRole('button', { name: 'Cobrar' })
        await expect(pay).toBeDisabled()
        await panel.getByText('Consumidor final').click()
        await expect(
            panel.getByRole('switch', { name: 'Consumidor final' })
        ).toBeChecked()
        await expect(pay).toBeEnabled()

        await panel
            .getByRole('button', { name: 'Quitar Bisagra cazoleta 35mm' })
            .click()
        await expect(panel.getByText('Bisagra cazoleta 35mm')).toHaveCount(0)
    })

    test('completa una venta en efectivo y muestra el recibo', async ({
        page,
        api,
    }) => {
        mockPOS(api)
        await page.goto('/pos')
        await product(page, 'Tablero MDF 15mm').click()
        await product(page, 'Tablero MDF 15mm').click()
        const panel = order(page)
        await panel.getByText('Consumidor final').click()

        await panel.getByRole('button', { name: 'Cobrar' }).click()
        const payment = page.getByRole('dialog', { name: 'Cobrar' })
        await expect(
            payment.getByRole('button', { name: 'Efectivo' })
        ).toHaveAttribute('aria-pressed', 'true')
        await payment.getByRole('button', { name: 'Completar venta' }).click()

        const receipt = page.getByRole('dialog', { name: 'Venta completada' })
        await expect(receipt).toContainText('Venta #901')
        await expect(receipt).toContainText('2x Tablero MDF 15mm')

        const sale = api.callsTo('POST', `${POS}/sales/quick`)[0].body as {
            items: unknown[]
            payments: { paymentMethod: string; amount: number }[]
        }
        expect(sale.items).toEqual([
            { productId: 1, quantity: 2, unitPrice: 12.5 },
        ])
        expect(sale.payments).toHaveLength(1)
        expect(sale.payments[0].paymentMethod).toBe('CASH')
        // 2 × 12,50 más IVA: el total lo calcula la app igual que faclab-core
        expect(sale.payments[0].amount).toBeGreaterThanOrEqual(25)

        await receipt.getByRole('button', { name: 'Cerrar' }).first().click()
        await expect(panel.getByText('Carrito vacío')).toBeVisible()
    })

    test('si la venta falla avisa y conserva la orden', async ({
        page,
        api,
    }) => {
        mockPOS(api)
        api.post(`${POS}/sales/quick`, () =>
            apiError(409, 'INSUFFICIENT_STOCK', 'Stock insuficiente')
        )
        await page.goto('/pos')
        await product(page, 'Tablero MDF 15mm').click()
        const panel = order(page)
        await panel.getByText('Consumidor final').click()
        await panel.getByRole('button', { name: 'Cobrar' }).click()

        await page
            .getByRole('dialog', { name: 'Cobrar' })
            .getByRole('button', { name: 'Completar venta' })
            .click()

        await expect(page.getByText('Stock insuficiente')).toBeVisible()
        await expect(page.getByRole('dialog', { name: 'Cobrar' })).toBeVisible()
        await expect(panel.getByText('Tablero MDF 15mm')).toBeVisible()
    })
})
