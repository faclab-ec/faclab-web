import { test, expect } from '../support/test'
import { mockEmptyBackend } from '../fixtures/backend'
import {
    buildInvoice,
    invoicingNotReady,
    invoicingReady,
    stuckInvoice,
} from '../fixtures/invoicing'
import { dashboard } from '../fixtures/dashboard'
import { ADMIN, INVOICING, apiError, ok } from '../support/mockApi'
import { ROLE } from '@/constants/roles.constant'

test.describe('Estado de la facturación', () => {
    test('avisa en toda la app cuando la facturación no está lista', async ({
        page,
        api,
        signIn,
    }) => {
        mockEmptyBackend(api)
        await signIn()
        api.get(`${INVOICING}/invoicing/status`, () => ok(invoicingNotReady()))

        await page.goto('/suppliers')

        const banner = page
            .getByRole('alert')
            .filter({ hasText: 'La facturación electrónica no está lista' })
        await expect(banner).toContainText(
            'No hay un certificado de firma seleccionado'
        )
        await expect(banner).toContainText('3 facturas esperan')

        await banner
            .getByRole('button', { name: 'Certificados digitales' })
            .click()
        await expect(page).toHaveURL(/\/settings\/certificates$/)
    })

    test('quien no administra ve el aviso sin accesos a la configuración', async ({
        page,
        api,
        signIn,
    }) => {
        mockEmptyBackend(api)
        await signIn({ role: ROLE.OPERATOR, username: 'bodega' })
        api.get(`${INVOICING}/invoicing/status`, () => ok(invoicingNotReady()))

        await page.goto('/suppliers')

        const banner = page
            .getByRole('alert')
            .filter({ hasText: 'La facturación electrónica no está lista' })
        await expect(banner).toContainText(
            'Pide a un administrador que la complete.'
        )
        await expect(
            banner.getByRole('button', { name: 'Perfil fiscal' })
        ).toHaveCount(0)
    })

    test('no muestra avisos cuando todo está en orden', async ({
        page,
        api,
        signIn,
    }) => {
        mockEmptyBackend(api)
        await signIn()
        api.get(`${INVOICING}/invoicing/status`, () => ok(invoicingReady()))

        await page.goto('/suppliers')

        await expect(
            page.getByRole('heading', { name: 'Proveedores', exact: true })
        ).toBeVisible()
        await expect(
            page.getByText('La facturación electrónica no está lista')
        ).toHaveCount(0)
    })

    test('el resumen muestra el estado y lleva a las facturas por atender', async ({
        page,
        api,
        signIn,
    }) => {
        mockEmptyBackend(api)
        await signIn()
        api.get(`${ADMIN}/dashboard`, () =>
            ok(dashboard({ uninvoicedSales: 5 }))
        )
        api.get(`${INVOICING}/invoicing/status`, () =>
            ok(invoicingReady({ pendingInvoices: 4, invoicesWithIssues: 2 }))
        )

        await page.goto('/home')

        await expect(page.getByText('$48.250,75')).toBeVisible()
        const attention = page.getByRole('button', {
            name: /Requieren atención/,
        })
        await expect(attention).toContainText('2')

        await attention.click()
        await expect(page).toHaveURL(/\/invoices\?attention=1$/)
    })
})

test.describe('Facturas', () => {
    test('lista los comprobantes con su número SRI y estado', async ({
        page,
        api,
        signIn,
    }) => {
        mockEmptyBackend(api)
        await signIn()
        api.get(`${INVOICING}/invoices`, () =>
            ok([buildInvoice(), stuckInvoice()])
        )

        await page.goto('/invoices')

        const authorized = page
            .getByRole('row')
            .filter({ hasText: '001-002-000000123' })
        await expect(authorized).toContainText('Autorizada')
        const stuck = page.getByRole('row').filter({ hasText: '#502' })
        await expect(stuck).toContainText('Pendiente')
        await expect(stuck).toContainText('El SRI no respondió')
    })

    test('reintenta una factura detenida y muestra el resultado', async ({
        page,
        api,
        signIn,
    }) => {
        mockEmptyBackend(api)
        await signIn()
        let invoice = stuckInvoice()
        api.get(`${INVOICING}/invoices`, () => ok([invoice]))
        api.post(`${INVOICING}/invoices/:id/retry`, () => {
            invoice = buildInvoice({ id: invoice.id, saleId: invoice.saleId })
            return ok(invoice)
        })

        await page.goto('/invoices?attention=1')
        const stuck = page.getByRole('row').filter({ hasText: '#502' })
        await stuck
            .getByRole('button', { name: 'Reintentar', exact: true })
            .click()

        await expect(page.getByText('Factura reintentada')).toBeVisible()
        await expect(page.getByText('Estado: Autorizada')).toBeVisible()
        expect(
            api.callsTo('POST', `${INVOICING}/invoices/:id/retry`)[0].params.id
        ).toBe('inv-2')
    })

    test('avisa si el servicio de facturación no responde', async ({
        page,
        api,
        signIn,
    }) => {
        mockEmptyBackend(api)
        await signIn()
        api.get(`${INVOICING}/invoices`, () =>
            apiError(503, 'INTERNAL_ERROR', 'Service unavailable')
        )

        await page.goto('/invoices')

        await expect(
            page.getByText('No se pudo cargar la información')
        ).toBeVisible()
        await expect(
            page.getByText('El servicio de facturación no responde')
        ).toBeVisible()
        await expect(
            page.getByRole('button', { name: 'Reintentar' })
        ).toBeVisible()
    })
})
