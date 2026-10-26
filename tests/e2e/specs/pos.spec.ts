import { test, expect } from '../support/test'
import { SALE_NUMBER, mockPOS, openShift, posTerminal } from '../fixtures/pos'
import { MAIN_BRANCH, SECOND_BRANCH } from '../support/session'
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
        // El cajero es el usuario de la sesión; no se puede escribir otro.
        // La única caja de la sucursal se vinculó sola
        const form = page.getByRole('main')
        await expect(form.getByText('caja1', { exact: true })).toBeVisible()
        await expect(form.getByText('001 · Matriz')).toBeVisible()
        await expect(form.getByText('Caja 1 (CAJA-01)')).toBeVisible()
        await expect(page.getByLabel('Nombre del cajero')).toHaveCount(0)
        const balance = page.getByLabel('Saldo inicial')
        await balance.fill('-5')
        await page.getByRole('button', { name: 'Abrir turno' }).click()

        await expect(balance).toHaveAttribute('aria-invalid', 'true')
        expect(api.callsTo('POST', `${POS}/shifts/open`)).toHaveLength(0)
    })

    test('abre un turno y entra al punto de venta', async ({ page, api }) => {
        mockPOS(api, null)
        let opened = false
        api.get(`${POS}/shifts/active`, () =>
            ok(
                opened
                    ? {
                          ...openShift({ id: 7 }),
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

        await page.getByLabel('Saldo inicial').fill('80')
        await page.getByRole('button', { name: 'Abrir turno' }).click()

        await expect(
            page.getByRole('heading', { name: 'Hola, Luis' })
        ).toBeVisible()
        // El backend toma el cajero del token: el cuerpo no lo lleva. La
        // sucursal y la caja van en los encabezados
        const [open] = api.callsTo('POST', `${POS}/shifts/open`)
        expect(open.body).toEqual({ openingBalance: 80 })
        expect(open.headers['x-branch-id']).toBe('1')
        expect(open.headers['x-terminal-id']).toBe('11')
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
        await expect(receipt).toContainText(`Venta ${SALE_NUMBER}`)
        await expect(receipt).toContainText('Caja Caja 1 (CAJA-01)')
        await expect(receipt).toContainText('2x Tablero MDF 15mm')

        const [quickSale] = api.callsTo('POST', `${POS}/sales/quick`)
        // La venta sale de la caja vinculada: su punto de emisión y su stock
        expect(quickSale.headers['x-branch-id']).toBe('1')
        expect(quickSale.headers['x-terminal-id']).toBe('11')
        const sale = quickSale.body as {
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

test.describe('Caja del navegador', () => {
    const CAJA_2 = posTerminal({ id: 12, code: 'CAJA-02', name: 'Caja 2' })

    test('vincula el navegador a la caja elegida y la recuerda', async ({
        page,
        api,
        signIn,
    }) => {
        await signIn({ role: ROLE.CASHIER, username: 'caja1' })
        mockPOS(api, null, [posTerminal(), CAJA_2])
        await page.goto('/pos')

        await expect(
            page.getByRole('heading', { name: 'Elige la caja' })
        ).toBeVisible()
        // Una sola sucursal: se muestra, no se elige
        await expect(
            page.getByRole('main').getByLabel('Sucursal', { exact: true })
        ).toHaveCount(0)
        await page
            .getByRole('list', { name: 'Cajas' })
            .getByRole('button', { name: /Caja 2/ })
            .click()

        await expect(
            page.getByRole('heading', { name: 'Abrir turno' })
        ).toBeVisible()
        await expect(page.getByText('Caja 2 (CAJA-02)')).toBeVisible()
        const [active] = api.callsTo('GET', `${POS}/shifts/active`)
        expect(active.headers['x-terminal-id']).toBe('12')

        // Al volver a abrir el POS la caja sigue vinculada
        await page.reload()
        await expect(page.getByText('Caja 2 (CAJA-02)')).toBeVisible()
        await expect(
            page.getByRole('heading', { name: 'Elige la caja' })
        ).toHaveCount(0)
    })

    test('una caja vinculada que se desactivó pide elegir otra', async ({
        page,
        api,
        signIn,
    }) => {
        await signIn({
            role: ROLE.CASHIER,
            username: 'caja1',
            terminal: { branchId: 1, terminalId: 99 },
        })
        mockPOS(api, null, [posTerminal(), CAJA_2])
        await page.goto('/pos')

        await expect(page.getByText('Caja no disponible')).toBeVisible()
        await expect(
            page.getByRole('heading', { name: 'Elige la caja' })
        ).toBeVisible()
        // No pidió el turno de una caja que el backend ya no tiene activa
        expect(api.callsTo('GET', `${POS}/shifts/active`)).toHaveLength(0)
    })

    test('con varias sucursales elige primero la sucursal', async ({
        page,
        api,
        signIn,
    }) => {
        await signIn({
            role: ROLE.CASHIER,
            username: 'caja1',
            branches: [MAIN_BRANCH, SECOND_BRANCH],
        })
        mockPOS(api, null, [posTerminal(), CAJA_2])
        api.get(`${POS}/terminals`, ({ headers }) =>
            ok(
                headers['x-branch-id'] === '2'
                    ? [
                          posTerminal({
                              id: 21,
                              branchId: 2,
                              code: 'NORTE-01',
                              name: 'Caja Norte',
                          }),
                      ]
                    : [posTerminal(), CAJA_2]
            )
        )
        await page.goto('/pos')

        // El selector del POS, no el del encabezado que queda detrás. Sin
        // búsqueda (pantalla táctil): se abre con el teclado
        await page
            .getByRole('main')
            .getByLabel('Sucursal', { exact: true })
            .focus()
        await page.keyboard.press('ArrowDown')
        await page.getByRole('option', { name: '002 · Sucursal Norte' }).click()

        // La única caja de esa sucursal se vincula sola
        await expect(page.getByText('Caja Norte (NORTE-01)')).toBeVisible()
        const [active] = api.callsTo('GET', `${POS}/shifts/active`)
        expect(active.headers['x-branch-id']).toBe('2')
        expect(active.headers['x-terminal-id']).toBe('21')
    })

    test('una sucursal sin cajas activas lo dice', async ({
        page,
        api,
        signIn,
    }) => {
        await signIn({ role: ROLE.CASHIER, username: 'caja1' })
        mockPOS(api, null, [])
        await page.goto('/pos')

        await expect(
            page.getByText('La sucursal no tiene cajas activas')
        ).toBeVisible()
    })
})
