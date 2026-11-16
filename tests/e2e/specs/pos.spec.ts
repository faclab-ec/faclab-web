import { test, expect } from '../support/test'
import {
    HINGE_BOX_BARCODE,
    SALE_NUMBER,
    WHOLESALE_PRICES,
    builder,
    mockPOS,
    openShift,
    posTerminal,
} from '../fixtures/pos'
import { mockEmptyBackend } from '../fixtures/backend'
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
        await expect(
            panel.getByRole('textbox', { name: 'Cantidad de Tablero MDF 15mm' })
        ).toHaveValue('2')
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
        await expect(receipt).toContainText('2 x Tablero MDF 15mm')

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
        // 2 × 12,50 más IVA: sin monto escrito, el cliente entrega el total, que
        // la app calcula igual que faclab-core
        expect(sale.payments[0].amount).toBe(28.75)

        await receipt.getByRole('button', { name: 'Cerrar' }).first().click()
        await expect(panel.getByText('Carrito vacío')).toBeVisible()
    })

    test('un cliente con lista mayorista compra al precio de su lista', async ({
        page,
        api,
    }) => {
        mockPOS(api, openShift(), [posTerminal()], WHOLESALE_PRICES)
        await page.goto('/pos')
        await product(page, 'Tablero MDF 15mm').click()
        await product(page, 'Bisagra cazoleta 35mm').click()
        const panel = order(page)

        await panel.getByRole('button', { name: 'Buscar' }).click()
        const search = page.getByRole('dialog')
        await search.getByLabel('RUC / Cedula').fill(builder().taxId)
        await search.getByRole('button', { name: 'Seleccionar' }).click()

        // El tablero sale de su lista; la bisagra, sin precio en ella, del general
        await expect(panel.getByText('· Mayorista')).toHaveCount(1)
        const pay = panel.getByRole('button', { name: 'Cobrar' })
        await expect(pay).toBeEnabled()
        const [resolve] = api.callsTo('POST', `${POS}/prices/resolve`).slice(-1)
        expect(resolve.body).toEqual({
            customerId: builder().id,
            items: [
                { productId: 1, presentationId: null, quantity: 1 },
                { productId: 2, presentationId: null, quantity: 1 },
            ],
        })

        await pay.click()
        await page
            .getByRole('dialog', { name: 'Cobrar' })
            .getByRole('button', { name: 'Completar venta' })
            .click()
        await expect(
            page.getByRole('dialog', { name: 'Venta completada' })
        ).toBeVisible()

        const [quickSale] = api.callsTo('POST', `${POS}/sales/quick`)
        const sale = quickSale.body as { customerId: number; items: unknown[] }
        // El precio de lista no es un cambio de precio: no lleva motivo
        expect(sale.customerId).toBe(builder().id)
        expect(sale.items).toEqual([
            { productId: 1, quantity: 1, unitPrice: 11 },
            { productId: 2, quantity: 1, unitPrice: 0.95 },
        ])
    })

    test('vende a crédito a un cliente con cupo (S5.5)', async ({
        page,
        api,
    }) => {
        mockPOS(api)
        await page.goto('/pos')
        await product(page, 'Tablero MDF 15mm').click()
        const panel = order(page)

        await panel.getByRole('button', { name: 'Buscar' }).click()
        const search = page.getByRole('dialog')
        await search.getByLabel('RUC / Cedula').fill(builder().taxId)
        await search.getByRole('button', { name: 'Seleccionar' }).click()

        await panel.getByRole('button', { name: 'Cobrar' }).click()
        const payment = page.getByRole('dialog', { name: 'Cobrar' })
        await payment
            .getByRole('button', { name: 'Crédito', exact: true })
            .click()
        await expect(payment.getByText(/Disponible a crédito/)).toBeVisible()
        await payment.getByRole('button', { name: 'Completar venta' }).click()
        await expect(
            page.getByRole('dialog', { name: 'Venta completada' })
        ).toBeVisible()

        const [quickSale] = api.callsTo('POST', `${POS}/sales/quick`)
        const sale = quickSale.body as {
            customerId: number
            payments: { paymentMethod: string; amount: number }[]
        }
        expect(sale.customerId).toBe(builder().id)
        // Todo el total, sin monto escrito, a la cuenta del cliente
        expect(sale.payments).toHaveLength(1)
        expect(sale.payments[0].paymentMethod).toBe('CREDIT')
        expect(sale.payments[0].amount).toBeGreaterThan(0)
    })

    test('el consumidor final no compra a crédito', async ({ page, api }) => {
        mockPOS(api)
        await page.goto('/pos')
        await product(page, 'Tablero MDF 15mm').click()
        const panel = order(page)
        await panel.getByText('Consumidor final').click()

        await panel.getByRole('button', { name: 'Cobrar' }).click()
        const payment = page.getByRole('dialog', { name: 'Cobrar' })
        await expect(
            payment.getByRole('button', { name: 'Crédito', exact: true })
        ).toBeDisabled()
    })

    test('recibe un abono del cliente en la caja del turno', async ({
        page,
        api,
    }) => {
        mockPOS(api)
        await page.goto('/pos')

        await page.getByRole('button', { name: 'Abono' }).click()
        const dialog = page.getByRole('dialog', { name: 'Abono de cliente' })
        await dialog.getByLabel('Buscar por RUC o cédula').fill(builder().taxId)
        await dialog
            .getByRole('button', { name: new RegExp(builder().name) })
            .click()
        await dialog.getByLabel('Monto').fill('50')
        await dialog.getByRole('button', { name: 'Registrar abono' }).click()

        await expect(dialog).toHaveCount(0)
        const [post] = api.callsTo('POST', `${POS}/customer-payments`)
        expect(post.headers['x-terminal-id']).toBe('11')
        expect(post.headers['idempotency-key']).toBeTruthy()
        expect(post.body).toEqual({
            customerId: builder().id,
            amount: 50,
            paymentMethod: 'CASH',
            reference: null,
            notes: null,
        })
    })

    test('cierra el turno con arqueo y justifica la diferencia (S5.9)', async ({
        page,
        api,
    }) => {
        mockEmptyBackend(api)
        mockPOS(api)
        // Vendió 30 en efectivo y 40 con tarjeta sobre 50 de apertura
        api.get(`${POS}/shifts/:id/cash-summary`, () =>
            ok({
                shiftId: 42,
                openingBalance: 50,
                cashSales: 30,
                cashRefunds: 0,
                customerPayments: 0,
                cashIn: 0,
                cashOut: 0,
                expectedBalance: 80,
                byMethod: [
                    {
                        paymentMethod: 'CASH',
                        paymentsTotal: 30,
                        customerPaymentsTotal: 0,
                        refundsTotal: 0,
                        expected: 80,
                    },
                    {
                        paymentMethod: 'CREDIT_CARD',
                        paymentsTotal: 40,
                        customerPaymentsTotal: 0,
                        refundsTotal: 0,
                        expected: 40,
                    },
                ],
                justificationThreshold: 1,
            })
        )
        api.post(`${POS}/shifts/:id/close`, () =>
            ok(
                openShift({
                    status: 'CLOSED',
                    closedAt: '2026-01-15T22:00:00.000Z',
                    closedBy: 'Ana',
                    closingBalance: 75,
                    expectedBalance: 80,
                    discrepancy: -5,
                    closingNumber: 'Z-001-CAJA-01-000001',
                })
            )
        )
        await page.goto('/pos')

        await page
            .getByRole('button', { name: 'Cerrar turno', exact: true })
            .click()
        const dialog = page.getByRole('dialog', { name: 'Cerrar turno' })
        const close = dialog.getByRole('button', {
            name: 'Cerrar Turno',
            exact: true,
        })
        // Hasta contar cada medio no se puede cerrar
        await expect(close).toBeDisabled()
        await dialog.getByLabel('Efectivo contado').fill('75')
        await dialog.getByLabel('Tarjeta crédito contado').fill('40')
        await expect(dialog.getByTestId('count-CASH')).toContainText('-5')
        // Faltan 5 y el umbral es 1: hay que justificarlo
        const justification = dialog.getByLabel('Justificación de efectivo')
        await expect(justification).toBeVisible()
        await expect(close).toBeDisabled()
        await expect(
            dialog.getByLabel('Justificación de tarjeta crédito')
        ).toHaveCount(0)
        await justification.fill('Billete falso retirado')
        await close.click()

        await expect(page).toHaveURL(/\/home$/)
        const [closing] = api.callsTo('POST', `${POS}/shifts/42/close`)
        expect(closing.body).toEqual({
            counts: [
                {
                    paymentMethod: 'CASH',
                    counted: 75,
                    justification: 'Billete falso retirado',
                },
                { paymentMethod: 'CREDIT_CARD', counted: 40 },
            ],
        })
    })

    test('vende 2,5 m de cable y cobra lo que calcula faclab-core', async ({
        page,
        api,
    }) => {
        mockPOS(api)
        await page.goto('/pos')
        await product(page, 'Cable gemelo 2x14 AWG').click()
        const panel = order(page)
        const quantity = panel.getByRole('textbox', {
            name: 'Cantidad de Cable gemelo 2x14 AWG',
        })
        await quantity.fill('2,5')
        await quantity.press('Enter')
        await expect(quantity).toHaveValue('2,5')
        await expect(panel.getByText('m', { exact: true })).toBeVisible()
        await panel.getByText('Consumidor final').click()

        await panel.getByRole('button', { name: 'Cobrar' }).click()
        const payment = page.getByRole('dialog', { name: 'Cobrar' })
        await payment.getByRole('button', { name: 'Completar venta' }).click()

        const receipt = page.getByRole('dialog', { name: 'Venta completada' })
        await expect(receipt).toContainText('2,5 x Cable gemelo 2x14 AWG')
        const [quickSale] = api.callsTo('POST', `${POS}/sales/quick`)
        const sale = quickSale.body as {
            items: unknown[]
            payments: { amount: number }[]
        }
        expect(sale.items).toEqual([
            { productId: 4, quantity: 2.5, unitPrice: 0.85 },
        ])
        // 2,5 × 0,85 = 2,125 → 2,13 más 0,32 de IVA, como en faclab-core
        expect(sale.payments[0].amount).toBe(2.45)
    })

    test('escanear el código de la caja agrega la caja con su precio', async ({
        page,
        api,
    }) => {
        mockPOS(api)
        await page.goto('/pos')
        const search = page.getByRole('searchbox', { name: 'Buscar productos' })

        // Un lector de códigos escribe el código y Enter
        await search.fill(HINGE_BOX_BARCODE)
        await search.press('Enter')

        const panel = order(page)
        await expect(panel).toContainText('Bisagra cazoleta 35mm')
        await expect(panel).toContainText('Caja x50')
        await expect(search).toHaveValue('')
        // Una segunda caja suma a la misma línea; una unidad va aparte
        await search.fill(HINGE_BOX_BARCODE)
        await search.press('Enter')
        await product(page, 'Bisagra cazoleta 35mm').click()
        const quantities = panel.getByRole('textbox', {
            name: 'Cantidad de Bisagra cazoleta 35mm',
        })
        await expect(quantities).toHaveCount(2)
        await expect(quantities.first()).toHaveValue('2')

        await panel.getByText('Consumidor final').click()
        await panel.getByRole('button', { name: 'Cobrar' }).click()
        const payment = page.getByRole('dialog', { name: 'Cobrar' })
        await payment.getByRole('button', { name: 'Completar venta' }).click()

        const receipt = page.getByRole('dialog', { name: 'Venta completada' })
        await expect(receipt).toContainText(
            '2 x Bisagra cazoleta 35mm (Caja x50)'
        )
        const [quickSale] = api.callsTo('POST', `${POS}/sales/quick`)
        const sale = quickSale.body as {
            items: unknown[]
            payments: { amount: number }[]
        }
        expect(sale.items).toEqual([
            { productId: 2, presentationId: 250, quantity: 2, unitPrice: 20 },
            { productId: 2, quantity: 1, unitPrice: 0.95 },
        ])
        // 40 + 0,95 = 40,95 más 6,14 de IVA
        expect(sale.payments[0].amount).toBe(47.09)
    })

    test('un código que no es de barras deja la búsqueda', async ({
        page,
        api,
    }) => {
        mockPOS(api)
        await page.goto('/pos')
        const search = page.getByRole('searchbox', { name: 'Buscar productos' })

        await search.fill('tirador')
        await search.press('Enter')

        await expect(search).toHaveValue('tirador')
        await expect(product(page, 'Tirador acero 128mm')).toBeVisible()
        await expect(order(page).getByText('Carrito vacío')).toBeVisible()
    })

    test('una unidad sin decimales no acepta 1,5 en el carrito', async ({
        page,
        api,
    }) => {
        mockPOS(api)
        await page.goto('/pos')
        await product(page, 'Tablero MDF 15mm').click()
        const panel = order(page)
        const quantity = panel.getByRole('textbox', {
            name: 'Cantidad de Tablero MDF 15mm',
        })

        await quantity.fill('1,5')
        await quantity.press('Enter')

        await expect(panel.getByRole('alert')).toHaveText(
            'Solo cantidades enteras'
        )
        await quantity.press('Escape')
        await expect(quantity).toHaveValue('1')
    })

    test('en efectivo envía lo entregado y el recibo muestra el vuelto', async ({
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
        await payment.getByLabel('Monto recibido').fill('30')
        await expect(payment).toContainText('Cambio')
        await expect(payment).toContainText('1,25')
        await payment.getByRole('button', { name: 'Completar venta' }).click()

        const receipt = page.getByRole('dialog', { name: 'Venta completada' })
        await expect(receipt).toContainText('Cambio: $1,25')
        const [quickSale] = api.callsTo('POST', `${POS}/sales/quick`)
        const sale = quickSale.body as {
            payments: { paymentMethod: string; amount: number }[]
        }
        // Lo que entrega el cliente: faclab-core aplica 28,75 y guarda el vuelto
        expect(sale.payments).toEqual([{ amount: 30, paymentMethod: 'CASH' }])
    })

    test('con tarjeta no deja cobrar más de lo que falta', async ({
        page,
        api,
    }) => {
        mockPOS(api)
        await page.goto('/pos')
        await product(page, 'Tablero MDF 15mm').click()
        const panel = order(page)
        await panel.getByText('Consumidor final').click()
        await panel.getByRole('button', { name: 'Cobrar' }).click()

        const payment = page.getByRole('dialog', { name: 'Cobrar' })
        await payment.getByRole('button', { name: 'Tarjeta crédito' }).click()
        await payment.getByLabel('Monto recibido').fill('20')

        await expect(payment).toContainText(
            'Solo el efectivo puede superar lo que falta por cobrar.'
        )
        await expect(
            payment.getByRole('button', { name: 'Completar venta' })
        ).toBeDisabled()
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
