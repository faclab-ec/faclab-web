import { test, expect } from '../support/test'
import { mockEmptyBackend } from '../fixtures/backend'
import {
    ACCESS_CODE,
    buildInvoice,
    invoicingNotReady,
    invoicingReady,
    stuckInvoice,
} from '../fixtures/invoicing'
import { dashboard } from '../fixtures/dashboard'
import {
    ADMIN,
    INVOICING,
    apiError,
    file,
    noContent,
    ok,
} from '../support/mockApi'
import { buildEmissionPoint, mockOrganization } from '../fixtures/organization'
import { TENANT } from '../support/session'
import type {
    CompanyConfig,
    InvoiceDelivery,
} from '@/features/invoicing/model/types'
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

    test('descarga el RIDE y el XML de una factura autorizada', async ({
        page,
        api,
        signIn,
    }) => {
        mockEmptyBackend(api)
        await signIn()
        api.get(`${INVOICING}/invoices`, () =>
            ok([buildInvoice(), stuckInvoice()])
        )
        api.get(`${INVOICING}/invoices/:id/ride`, () =>
            file('%PDF-1.3 RIDE', 'application/pdf')
        )
        api.get(`${INVOICING}/invoices/:id/authorized-xml`, () =>
            file('<autorizacion/>', 'application/xml')
        )

        await page.goto('/invoices')
        const authorized = page
            .getByRole('row')
            .filter({ hasText: '001-002-000000123' })

        const [ride] = await Promise.all([
            page.waitForEvent('download'),
            authorized.getByRole('button', { name: 'Descargar RIDE' }).click(),
        ])
        expect(ride.suggestedFilename()).toBe(`${ACCESS_CODE}.pdf`)
        const [xml] = await Promise.all([
            page.waitForEvent('download'),
            authorized.getByRole('button', { name: 'Descargar XML' }).click(),
        ])
        expect(xml.suggestedFilename()).toBe(`${ACCESS_CODE}.xml`)
        // Una factura sin autorizar no tiene documentos
        const stuck = page.getByRole('row').filter({ hasText: '#502' })
        await expect(
            stuck.getByRole('button', { name: 'Descargar RIDE' })
        ).toHaveCount(0)
    })

    test('reenvía la factura al comprador y muestra el registro de envío', async ({
        page,
        api,
        signIn,
    }) => {
        mockEmptyBackend(api)
        await signIn()
        const sent: InvoiceDelivery = {
            id: 'd-1',
            invoiceId: 'inv-1',
            kind: 'authorization',
            recipient: 'compras@andinas.ec',
            status: 'sent',
            attempts: 0,
            nextAttemptAt: null,
            lastError: null,
            smtpResponse: '250 OK',
            sentAt: '2026-01-15T14:00:10.000Z',
            requestedBy: null,
            createdAt: '2026-01-15T14:00:05.000Z',
            updatedAt: '2026-01-15T14:00:10.000Z',
        }
        let deliveries = [sent]
        api.get(`${INVOICING}/invoices`, () => ok([buildInvoice()]))
        api.get(`${INVOICING}/invoices/:id/emails`, () => ok(deliveries))
        api.post(`${INVOICING}/invoices/:id/email`, () => {
            const resend: InvoiceDelivery = {
                ...sent,
                id: 'd-2',
                kind: 'resend',
                status: 'pending',
                smtpResponse: null,
                sentAt: null,
                requestedBy: 'admin',
            }
            deliveries = [resend, sent]
            return ok(resend, 202)
        })

        await page.goto('/invoices')
        await page.getByRole('button', { name: 'Ver detalle' }).click()
        const dialog = page.getByRole('dialog')
        await expect(dialog.getByText('Enviado')).toBeVisible()
        await expect(dialog.getByText('Al autorizarse')).toBeVisible()

        await dialog
            .getByRole('button', { name: 'Reenviar por correo' })
            .click()
        await expect(
            page.getByText('Se enviarán el RIDE y el XML autorizado a')
        ).toBeVisible()
        await page
            .getByRole('button', { name: 'Reenviar', exact: true })
            .click()

        await expect(page.getByText('Envío en curso')).toBeVisible()
        await expect(dialog.getByText('Por enviar')).toBeVisible()
        await expect(dialog.getByText('Reenvío, por admin')).toBeVisible()
        expect(
            api.callsTo('POST', `${INVOICING}/invoices/:id/email`)[0].params.id
        ).toBe('inv-1')
    })

    test('explica por qué no se pudo reenviar', async ({
        page,
        api,
        signIn,
    }) => {
        mockEmptyBackend(api)
        await signIn()
        api.get(`${INVOICING}/invoices`, () => ok([buildInvoice()]))
        api.post(`${INVOICING}/invoices/:id/email`, () =>
            apiError(409, 'EMAIL_DISABLED', 'Sending invoices by email is off')
        )

        await page.goto('/invoices')
        await page.getByRole('button', { name: 'Reenviar por correo' }).click()
        await page
            .getByRole('button', { name: 'Reenviar', exact: true })
            .click()

        await expect(
            page.getByText(
                'El envío de facturas por correo está desactivado en este servidor.'
            )
        ).toBeVisible()
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

test.describe('Perfil fiscal', () => {
    test('usa el RUC de la empresa y guarda el régimen RIMPE', async ({
        page,
        api,
        signIn,
    }) => {
        mockEmptyBackend(api)
        await signIn()
        let saved: CompanyConfig | null = null
        api.get(`${INVOICING}/company-config`, () =>
            saved
                ? ok(saved)
                : apiError(404, 'NOT_FOUND', 'Company config not found')
        )
        api.put(`${INVOICING}/company-config`, ({ body }) => {
            // Sin resoluciones en el cuerpo: quedan vacías
            saved = {
                ...(body as object),
                specialTaxpayerResolution: null,
                withholdingAgentResolution: null,
                email: null,
                hasLogo: false,
                updatedAt: '2026-01-15T15:00:00.000Z',
            } as CompanyConfig
            return ok(saved)
        })

        await page.goto('/settings/company-config')
        const ruc = page.getByLabel('RUC')
        await expect(ruc).toHaveValue(TENANT.ruc)
        await expect(ruc).toHaveAttribute('readonly', '')
        // Sin perfil todavía: parte de los datos de la empresa
        await expect(page.getByLabel('Razón Social')).toHaveValue(
            TENANT.legalName
        )
        // El establecimiento y el punto de emisión llegan con cada venta
        await expect(page.getByLabel('Código Establecimiento')).toHaveCount(0)
        await expect(page.getByLabel('Secuencia de Factura')).toHaveCount(0)

        await page.getByLabel('Dirección matriz').fill('Av. Loja 1-23, Cuenca')
        await page.getByLabel('Régimen RIMPE').click()
        await page.getByRole('option', { name: 'RIMPE emprendedor' }).click()
        await page.getByRole('button', { name: 'Guardar perfil' }).click()

        await expect(page.getByText('Perfil fiscal guardado')).toBeVisible()
        expect(
            api.callsTo('PUT', `${INVOICING}/company-config`)[0].body
        ).toEqual({
            taxId: TENANT.ruc,
            name: TENANT.legalName,
            tradeName: 'El Tornillo',
            mainAddress: 'Av. Loja 1-23, Cuenca',
            environment: 1,
            emissionType: 1,
            accountingRequired: false,
            rimpeRegime: 'EMPRENDEDOR',
            signingCertId: null,
        })
    })

    test('guarda el correo de respuesta y sube y quita el logo del RIDE', async ({
        page,
        api,
        signIn,
    }) => {
        mockEmptyBackend(api)
        await signIn()
        // Un PNG de 1 × 1
        const png = Buffer.from(
            'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
            'base64'
        )
        let config: CompanyConfig = {
            taxId: TENANT.ruc,
            name: TENANT.legalName,
            tradeName: 'El Tornillo',
            mainAddress: 'Av. Loja 1-23, Cuenca',
            specialTaxpayerResolution: null,
            withholdingAgentResolution: null,
            rimpeRegime: null,
            accountingRequired: false,
            environment: 1,
            emissionType: 1,
            signingCertId: null,
            email: null,
            hasLogo: false,
            updatedAt: '2026-01-15T15:00:00.000Z',
        }
        api.get(`${INVOICING}/company-config`, () => ok(config))
        api.put(`${INVOICING}/company-config`, ({ body }) => {
            config = { ...config, ...(body as Partial<CompanyConfig>) }
            return ok(config)
        })
        api.put(`${INVOICING}/company-config/logo`, () => {
            config = { ...config, hasLogo: true }
            return ok(config)
        })
        api.get(`${INVOICING}/company-config/logo`, () =>
            file(png, 'image/png')
        )
        api.delete(`${INVOICING}/company-config/logo`, () => {
            config = { ...config, hasLogo: false }
            return noContent()
        })

        await page.goto('/settings/company-config')
        await page
            .getByLabel('Correo de respuesta')
            .fill('ventas@eltornillo.ec')
        await page.getByRole('button', { name: 'Guardar perfil' }).click()
        await expect(page.getByText('Perfil fiscal guardado')).toBeVisible()
        expect(
            api.callsTo('PUT', `${INVOICING}/company-config`)[0].body
        ).toMatchObject({ email: 'ventas@eltornillo.ec' })

        await expect(page.getByText('Sin logo', { exact: true })).toBeVisible()
        await page.getByLabel('Archivo del logo').setInputFiles({
            name: 'logo.png',
            mimeType: 'image/png',
            buffer: png,
        })
        await expect(page.getByText('Logo guardado')).toBeVisible()
        await expect(
            page.getByRole('img', { name: 'Logo del RIDE' })
        ).toBeVisible()
        expect(
            api.callsTo('PUT', `${INVOICING}/company-config/logo`)
        ).toHaveLength(1)

        await page.getByRole('button', { name: 'Quitar' }).click()
        await page
            .getByRole('dialog')
            .getByRole('button', { name: 'Quitar' })
            .click()
        await expect(page.getByText('Logo quitado')).toBeVisible()
        await expect(page.getByText('Sin logo', { exact: true })).toBeVisible()
        expect(
            api.callsTo('DELETE', `${INVOICING}/company-config/logo`)
        ).toHaveLength(1)
    })

    test('sin perfil no deja subir certificados', async ({
        page,
        api,
        signIn,
    }) => {
        mockEmptyBackend(api)
        await signIn()

        await page.goto('/settings/certificates')

        await expect(
            page.getByText('Primero guarda el perfil fiscal de la empresa')
        ).toBeVisible()
        await expect(
            page.getByRole('button', { name: 'Subir Certificado' })
        ).toBeDisabled()
    })

    test('ajusta el secuencial de un punto de emisión', async ({
        page,
        api,
        signIn,
    }) => {
        mockEmptyBackend(api)
        await signIn()
        mockOrganization(api, {
            emissionPoints: [
                buildEmissionPoint(),
                buildEmissionPoint({ id: 2, code: '002', name: 'Caja 2' }),
            ],
        })
        api.get(`${INVOICING}/sequences`, () =>
            ok([
                {
                    establishment: '001',
                    emissionPoint: '001',
                    docType: '01',
                    lastSequence: '000000041',
                    nextSequence: 42,
                },
            ])
        )
        api.put(
            `${INVOICING}/sequences/:establishment/:emissionPoint`,
            ({ params, body }) =>
                ok({
                    establishment: params.establishment,
                    emissionPoint: params.emissionPoint,
                    docType: '01',
                    lastSequence: null,
                    ...(body as { nextSequence: number }),
                })
        )

        await page.goto('/settings/sequences')
        const issued = page.getByRole('row').filter({ hasText: '000000041' })
        await expect(issued).toContainText('42')
        // El punto que todavía no factura empieza en 1
        const fresh = page.getByRole('row').filter({ hasText: 'Caja 2' })
        await expect(fresh).toContainText('1')

        await page
            .getByRole('button', { name: 'Ajustar secuencial 001-002' })
            .click()
        const dialog = page.getByRole('dialog', { name: 'Secuencial 001-002' })
        await dialog.getByLabel('Siguiente número').fill('100')
        await dialog.getByRole('button', { name: 'Guardar' }).click()

        await expect(dialog).toBeHidden()
        const [update] = api.callsTo('PUT', `${INVOICING}/sequences/001/002`)
        expect(update.body).toEqual({ nextSequence: 100 })
    })
})
