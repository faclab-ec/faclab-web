import { test, expect } from '../support/test'
import { mockEmptyBackend } from '../fixtures/backend'
import { buildDelivery, mockIntegrations } from '../fixtures/integrations'
import { ADMIN, apiError } from '../support/mockApi'
import { ROLE } from '@/constants/roles.constant'

test.describe('Clientes de integración', () => {
    test.beforeEach(async ({ api, signIn }) => {
        mockEmptyBackend(api)
        mockIntegrations(api)
        await signIn()
    })

    test('crea un cliente y muestra su secreto una sola vez', async ({
        page,
        api,
    }) => {
        await page.goto('/settings/integrations')
        await expect(
            page.getByRole('link', { name: 'Tienda en línea' })
        ).toBeVisible()

        await page.getByRole('button', { name: 'Nuevo cliente' }).click()
        const dialog = page.getByRole('dialog', {
            name: 'Nuevo cliente de integración',
        })
        await dialog.getByLabel('Nombre').fill('ERP contable')
        // Sin scopes no se puede guardar
        await dialog.getByRole('button', { name: 'Guardar' }).click()
        await expect(
            dialog.getByText('Elige al menos un permiso')
        ).toBeVisible()

        await dialog.getByText('invoices:read').click()
        await dialog.getByText('sales:read', { exact: true }).click()
        await dialog
            .getByLabel('Redes de origen')
            .fill('203.0.113.7\n198.51.100.0/24')
        await dialog.getByRole('button', { name: 'Guardar' }).click()

        await expect(dialog).toBeHidden()
        expect(api.callsTo('POST', `${ADMIN}/integrations`)[0].body).toEqual({
            name: 'ERP contable',
            scopes: ['invoices:read', 'sales:read'],
            branchIds: null,
            allowedIps: ['203.0.113.7', '198.51.100.0/24'],
        })

        const credentials = page.getByRole('dialog', {
            name: 'Credenciales de ERP contable',
        })
        await expect(
            credentials.getByRole('textbox', { name: 'Client ID', exact: true })
        ).toHaveValue('fl_test_000000000002')
        await expect(
            credentials.getByRole('textbox', { name: 'Secreto', exact: true })
        ).toHaveValue('secreto-1-de-prueba')
        await expect(
            credentials.getByText('No lo podrás ver de nuevo', { exact: false })
        ).toBeVisible()
        await credentials.getByRole('button', { name: 'Ya lo guardé' }).click()
        await expect(credentials).toBeHidden()

        await page.getByRole('link', { name: 'ERP contable' }).click()
        await expect(
            page.getByRole('heading', { name: 'ERP contable' })
        ).toBeVisible()
        // El detalle ya no tiene el secreto: solo su prefijo
        await expect(page.getByText('secreto-1-de-prueba')).toHaveCount(0)
    })

    test('rota el secreto, revoca el anterior y luego el cliente', async ({
        page,
        api,
    }) => {
        await page.goto('/settings/integrations/1')
        await expect(
            page.getByRole('heading', { name: 'Tienda en línea' })
        ).toBeVisible()

        await page.getByRole('tab', { name: 'Secretos' }).click()
        await page.getByRole('button', { name: 'Nuevo secreto' }).click()
        const dialog = page.getByRole('dialog', { name: 'Nuevo secreto' })
        await dialog.getByRole('button', { name: 'Guardar' }).click()

        expect(
            api.callsTo('POST', `${ADMIN}/integrations/1/secrets`)[0].body
        ).toEqual({ previousExpiresInDays: 7 })
        const credentials = page.getByRole('dialog', {
            name: 'Nuevo secreto de Tienda en línea',
        })
        await expect(
            credentials.getByRole('textbox', { name: 'Secreto', exact: true })
        ).toHaveValue('secreto-1-de-prueba')
        await credentials.getByRole('button', { name: 'Ya lo guardé' }).click()

        const old = page.getByRole('row').filter({ hasText: 'Ab3dE9…' })
        await expect(old).toContainText('Por vencer')
        await old.getByRole('button', { name: 'Revocar' }).click()
        await page
            .getByRole('dialog', { name: 'Revocar secreto' })
            .getByRole('button', { name: 'Revocar' })
            .click()
        await expect(old).toContainText('Revocado')
        expect(
            api.callsTo('POST', `${ADMIN}/integrations/1/secrets/1/revoke`)
        ).toHaveLength(1)

        await page.getByRole('button', { name: 'Revocar cliente' }).click()
        await page
            .getByRole('dialog', { name: 'Revocar cliente' })
            .getByRole('button', { name: 'Revocar' })
            .click()
        // Revocado: ya no se edita ni recibe secretos
        await expect(
            page.getByRole('button', { name: 'Revocar cliente' })
        ).toHaveCount(0)
        await expect(
            page.getByRole('button', { name: 'Nuevo secreto' })
        ).toHaveCount(0)
        await expect(page.getByRole('button', { name: 'Editar' })).toHaveCount(
            0
        )
    })

    test('muestra el uso de los últimos 30 días', async ({ page }) => {
        await page.goto('/settings/integrations/1')
        await page.getByRole('tab', { name: 'Uso' }).click()

        await expect(page.getByText('Solicitudes (30 días)')).toBeVisible()
        await expect(
            page.getByRole('row').filter({ hasText: '203.0.113.7' })
        ).toContainText('120')
    })
})

test.describe('Webhooks', () => {
    test.beforeEach(async ({ api, signIn }) => {
        mockEmptyBackend(api)
        mockIntegrations(api, {
            deliveries: [
                buildDelivery(),
                buildDelivery({
                    id: 2,
                    messageId: 'msg_fallido',
                    eventType: 'stock.changed',
                    status: 'failed',
                    attempts: 9,
                    responseStatus: 500,
                    lastError: 'Internal Server Error',
                    deliveredAt: null,
                }),
            ],
        })
        await signIn()
    })

    test('crea un webhook de un cliente con los eventos que puede leer', async ({
        page,
        api,
    }) => {
        await page.goto('/settings/webhooks')
        await page.getByRole('button', { name: 'Nuevo webhook' }).click()
        const dialog = page.getByRole('dialog', { name: 'Nuevo webhook' })
        await dialog
            .getByRole('textbox', { name: /^URL/ })
            .fill('https://erp.example/hooks')
        await dialog.getByLabel('Dueño').click()
        await page.getByRole('option', { name: /Tienda en línea/ }).click()
        // El cliente no tiene invoices:read: no puede suscribirse a facturas
        await expect(
            dialog.getByRole('checkbox', { name: /Factura autorizada/ })
        ).toBeDisabled()
        await dialog.getByRole('checkbox', { name: /Venta confirmada/ }).check()
        await dialog.getByRole('checkbox', { name: /Cambio de stock/ }).check()
        await dialog.getByRole('button', { name: 'Guardar' }).click()

        await expect(page).toHaveURL(/\/settings\/webhooks\/2$/)
        expect(
            api.callsTo('POST', `${ADMIN}/webhook-endpoints`)[0].body
        ).toEqual({
            url: 'https://erp.example/hooks',
            eventTypes: ['sale.confirmed', 'stock.changed'],
            description: null,
            excludeOwnChanges: false,
            integrationClientId: 1,
        })
    })

    test('muestra el motivo del core cuando rechaza la URL', async ({
        page,
        api,
    }) => {
        api.post(`${ADMIN}/webhook-endpoints`, () =>
            apiError(
                422,
                'WEBHOOK_URL_NOT_ALLOWED',
                'The URL resolves to a private address',
                'url'
            )
        )
        await page.goto('/settings/webhooks')
        await page.getByRole('button', { name: 'Nuevo webhook' }).click()
        const dialog = page.getByRole('dialog', { name: 'Nuevo webhook' })
        await dialog
            .getByRole('textbox', { name: /^URL/ })
            .fill('https://10.0.0.5/hooks')
        await dialog.getByRole('checkbox', { name: /Venta anulada/ }).check()
        await dialog.getByRole('button', { name: 'Guardar' }).click()

        await expect(
            page.getByText(
                'La URL tiene que ser HTTPS y apuntar a una dirección pública',
                {
                    exact: false,
                }
            )
        ).toBeVisible()
        await expect(dialog).toBeVisible()
    })

    test('prueba el endpoint, muestra y rota el secreto y reenvía una entrega', async ({
        page,
        api,
    }) => {
        await page.goto('/settings/webhooks/1')
        await expect(
            page.getByRole('heading', { name: 'Pedidos de la tienda' })
        ).toBeVisible()

        await page.getByRole('button', { name: 'Probar' }).click()
        await expect(
            page.getByRole('row').filter({ hasText: 'Prueba' })
        ).toContainText('Pendiente')

        // El secreto se pide solo al mostrarlo
        expect(
            api.callsTo('GET', `${ADMIN}/webhook-endpoints/1/secret`)
        ).toHaveLength(0)
        await page.getByRole('button', { name: 'Mostrar secreto' }).click()
        await expect(
            page.getByRole('textbox', { name: 'Secreto', exact: true })
        ).toHaveValue('whsec_K5oZsecreto1')

        await page.getByRole('button', { name: 'Rotar secreto' }).click()
        await page
            .getByRole('dialog', { name: 'Rotar secreto' })
            .getByRole('button', { name: 'Guardar' })
            .click()
        expect(
            api.callsTo('POST', `${ADMIN}/webhook-endpoints/1/rotate-secret`)[0]
                .body
        ).toEqual({ previousExpiresInHours: 24 })
        await expect(
            page.getByRole('textbox', { name: 'Secreto', exact: true })
        ).toHaveValue('whsec_Rotado1nuevo')
        await expect(
            page.getByRole('textbox', { name: 'Secreto anterior', exact: true })
        ).toHaveValue('whsec_anterior1')

        const failed = page.getByRole('row').filter({ hasText: 'msg_fallido' })
        await expect(failed).toContainText('Respondió 500')
        await failed.getByRole('button', { name: 'Reenviar' }).click()
        await expect(failed).toContainText('Pendiente')
        expect(
            api.callsTo(
                'POST',
                `${ADMIN}/webhook-endpoints/1/deliveries/2/retry`
            )
        ).toHaveLength(1)
    })

    test('desactivado no se prueba ni reenvía hasta activarlo', async ({
        page,
    }) => {
        await page.goto('/settings/webhooks/1')
        await page.getByRole('button', { name: 'Desactivar' }).click()

        await expect(page.getByText('Desactivado · A mano')).toBeVisible()
        await expect(
            page.getByRole('button', { name: 'Probar' })
        ).toBeDisabled()
        await expect(
            page
                .getByRole('row')
                .filter({ hasText: 'msg_fallido' })
                .getByRole('button', { name: 'Reenviar' })
        ).toBeDisabled()

        await page.getByRole('button', { name: 'Activar' }).click()
        await expect(page.getByRole('button', { name: 'Probar' })).toBeEnabled()
    })
})

test.describe('Permiso del portal', () => {
    test('sin integration:manage no hay menú ni pantallas', async ({
        page,
        api,
        signIn,
    }) => {
        mockEmptyBackend(api)
        await signIn({ role: ROLE.MANAGER, username: 'gerente' })
        await page.goto('/home')

        const nav = page.getByRole('navigation', {
            name: 'Navegación principal',
        })
        await expect(
            nav.getByRole('link', { name: 'Integraciones' })
        ).toHaveCount(0)
        await expect(nav.getByRole('link', { name: 'Webhooks' })).toHaveCount(0)

        await page.goto('/settings/webhooks')
        await expect(page).toHaveURL(/\/access-denied$/)
    })
})
