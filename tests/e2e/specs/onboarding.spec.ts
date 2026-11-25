import { test, expect } from '../support/test'
import { mockEmptyBackend } from '../fixtures/backend'
import {
    builtChecklist,
    freshChecklist,
    profile,
    testInvoice,
} from '../fixtures/onboarding'
import { invoicingReady } from '../fixtures/invoicing'
import { ADMIN, INVOICING, apiError, ok } from '../support/mockApi'
import { TENANT } from '../support/session'
import { ROLE } from '@/constants/roles.constant'

const TEST_INVOICE = `${INVOICING}/invoicing/test-invoice`
const GO_LIVE = `${INVOICING}/company-config/go-live`

test.describe('Puesta en marcha', () => {
    test('una empresa nueva empieza por el perfil fiscal y lo demás espera', async ({
        page,
        api,
        signIn,
    }) => {
        mockEmptyBackend(api)
        await signIn()
        api.get(`${ADMIN}/onboarding`, () => ok(freshChecklist()))
        api.get(`${INVOICING}/invoicing/status`, () =>
            ok(
                invoicingReady({
                    ready: false,
                    environment: null,
                    certificate: null,
                    issues: [
                        {
                            code: 'CONFIG_MISSING',
                            severity: 'error',
                            message:
                                'The company fiscal config has not been saved',
                        },
                    ],
                })
            )
        )
        api.get(TEST_INVOICE, () => ok(testInvoice()))

        await page.goto('/settings/onboarding')

        const main = page.getByRole('main')
        await expect(
            main.getByRole('heading', { name: 'Puesta en marcha' })
        ).toBeVisible()
        await expect(main.getByText('El siguiente paso es')).toContainText(
            'Perfil fiscal'
        )
        const steps = main.getByRole('listitem')
        await expect(
            steps.filter({ hasText: 'Certificado de firma' })
        ).toContainText('Bloqueado')
        await expect(
            steps.filter({ hasText: 'Sucursales y puntos de emisión' })
        ).toContainText('Hecho')
        await expect(steps.filter({ hasText: 'Usuarios' })).toContainText(
            'Opcional'
        )
        await expect(
            steps.filter({ hasText: '9. Paso a producción' })
        ).toContainText('Primero la verificación en pruebas')
    })

    test('verifica en pruebas con una factura de prueba y pasa a producción confirmando', async ({
        page,
        api,
        signIn,
    }) => {
        mockEmptyBackend(api)
        await signIn()
        api.get(`${ADMIN}/onboarding`, () => ok(builtChecklist()))
        let environment: 1 | 2 = 1
        api.get(`${INVOICING}/company-config`, () =>
            ok(profile({ environment }))
        )
        api.get(`${INVOICING}/invoicing/status`, () =>
            ok(invoicingReady({ environment }))
        )
        // La factura de prueba tarda en autorizarse: dos lecturas en proceso
        let reads = 0
        let requested = false
        api.get(TEST_INVOICE, () => {
            if (!requested) return ok(testInvoice())
            reads += 1
            return ok(
                reads < 2
                    ? testInvoice({ status: 'PROCESSING', id: 't1' })
                    : testInvoice({
                          status: 'AUTHORIZED',
                          id: 't1',
                          number: '001-001-000000001',
                      })
            )
        })
        api.post(TEST_INVOICE, () => {
            requested = true
            return ok(testInvoice({ status: 'PROCESSING', id: 't1' }))
        })
        api.post(GO_LIVE, () => {
            environment = 2
            return ok(profile({ environment: 2 }))
        })

        await page.goto('/settings/onboarding')
        const main = page.getByRole('main')
        const verification = main
            .getByRole('listitem')
            .filter({ hasText: '8. Verificación' })
        await expect(verification).toContainText('La facturación está lista')

        // Sin factura de prueba no hay paso a producción
        const production = main
            .getByRole('listitem')
            .filter({ hasText: '9. Paso a producción' })
        await expect(production).toContainText('Bloqueado')

        await verification
            .getByRole('button', { name: 'Emitir factura de prueba' })
            .click()
        await expect(verification).toContainText('Autorizada por el SRI')
        await expect(verification).toContainText('001-001-000000001')

        await production
            .getByRole('button', { name: 'Pasar a producción…' })
            .click()
        const dialog = page.getByRole('dialog', { name: 'Pasar a producción' })
        const confirm = dialog.getByRole('button', {
            name: 'Pasar a producción',
        })
        // Hay que escribir el RUC de la empresa y aceptar
        await expect(confirm).toBeDisabled()
        await dialog.getByLabel(/Escribe el RUC/).fill('0190000000009')
        await dialog
            .getByRole('checkbox', { name: /emito facturas reales/ })
            .check()
        await expect(confirm).toBeDisabled()
        await dialog.getByLabel(/Escribe el RUC/).fill(TENANT.ruc)
        await expect(confirm).toBeEnabled()
        await confirm.click()

        await expect(
            main.getByText('La empresa emite en producción.').first()
        ).toBeVisible()
        expect(api.callsTo('POST', GO_LIVE)[0].body).toEqual({
            confirmRuc: TENANT.ruc,
            acknowledge: true,
        })
    })

    test('un error del servidor al pasar a producción se explica', async ({
        page,
        api,
        signIn,
    }) => {
        mockEmptyBackend(api)
        await signIn()
        api.get(`${ADMIN}/onboarding`, () => ok(builtChecklist()))
        api.get(`${INVOICING}/company-config`, () => ok(profile()))
        api.get(`${INVOICING}/invoicing/status`, () =>
            ok(invoicingReady({ environment: 1 }))
        )
        api.get(TEST_INVOICE, () =>
            ok(testInvoice({ status: 'AUTHORIZED', id: 't1' }))
        )
        api.post(GO_LIVE, () => {
            return apiError(
                409,
                'ENVIRONMENT_NOT_ALLOWED',
                'This deployment can only reach the SRI test environment'
            )
        })

        await page.goto('/settings/onboarding')
        await page.getByRole('button', { name: 'Pasar a producción…' }).click()
        const dialog = page.getByRole('dialog', { name: 'Pasar a producción' })
        await dialog.getByLabel(/Escribe el RUC/).fill(TENANT.ruc)
        await dialog
            .getByRole('checkbox', { name: /emito facturas reales/ })
            .check()
        await dialog.getByRole('button', { name: 'Pasar a producción' }).click()

        await expect(
            page.getByText(
                'Este servidor solo puede conectarse al ambiente de pruebas del SRI.'
            )
        ).toBeVisible()
    })

    test('el menú lo ofrece al administrador y no a quien no administra', async ({
        page,
        api,
        signIn,
    }) => {
        mockEmptyBackend(api)
        await signIn({ role: ROLE.MANAGER })

        await page.goto('/settings/subscription')

        await expect(
            page.getByRole('link', { name: 'Puesta en marcha' })
        ).toHaveCount(0)
    })
})
