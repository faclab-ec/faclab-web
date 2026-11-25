import { test, expect } from '../support/test'
import { mockEmptyBackend } from '../fixtures/backend'
import { mockOrganization } from '../fixtures/organization'
import { activeSubscription, buildSubscription } from '../fixtures/subscription'
import { ROLE } from '@/constants/roles.constant'
import { ADMIN, apiError, ok } from '../support/mockApi'

const READ_ONLY_TITLE =
    'La suscripción está suspendida: la empresa solo puede consultar'

test.describe('Plan y uso', () => {
    test('muestra el plan, el uso de cada límite y los comprobantes del mes', async ({
        page,
        api,
        signIn,
    }) => {
        mockEmptyBackend(api)
        await signIn()

        await page.goto('/settings/subscription')

        const main = page.getByRole('main')
        await expect(
            main.getByRole('heading', { name: 'Plan y uso' })
        ).toBeVisible()
        await expect(main.getByText('Básico', { exact: true })).toBeVisible()
        await expect(main.getByText('Activa', { exact: true })).toBeVisible()
        await expect(main.getByText('No incluida')).toBeVisible()
        await expect(
            main.getByRole('listitem').filter({ hasText: 'Sucursales activas' })
        ).toContainText('1 de 1')
        await expect(
            main.getByRole('listitem').filter({ hasText: 'Usuarios activos' })
        ).toContainText('2 de 3')
        await expect(main.getByText('de 300 del plan')).toBeVisible()
        const rows = main.getByRole('row')
        await expect(
            rows.filter({ hasText: 'noviembre de 2026' })
        ).toContainText('98')
    })

    test('una sucursal más allá del plan se explica', async ({
        page,
        api,
        signIn,
    }) => {
        mockEmptyBackend(api)
        await signIn()
        mockOrganization(api)
        api.post(`${ADMIN}/branches`, () =>
            apiError(
                409,
                'PLAN_LIMIT_REACHED',
                "The tenant's plan allows 1 branches"
            )
        )

        await page.goto('/settings/branches')
        await page.getByRole('button', { name: 'Nueva sucursal' }).click()
        const dialog = page.getByRole('dialog', { name: 'Nueva sucursal' })
        await dialog
            .getByRole('textbox', { name: /^Establecimiento/ })
            .fill('002')
        await dialog.getByLabel('Nombre', { exact: true }).fill('Norte')
        await dialog.getByRole('button', { name: 'Guardar' }).click()

        await expect(
            page.getByText(
                'El plan de la empresa no admite más de este recurso. Revisa Configuración → Plan y uso.'
            )
        ).toBeVisible()
    })

    test('una empresa suspendida sabe que solo puede consultar', async ({
        page,
        api,
        signIn,
    }) => {
        mockEmptyBackend(api)
        await signIn({
            subscription: activeSubscription({
                status: 'suspended',
                readOnly: true,
            }),
        })
        api.get(`${ADMIN}/subscription`, () =>
            ok(buildSubscription({ status: 'suspended', readOnly: true }))
        )

        await page.goto('/settings/subscription')

        await expect(page.getByText(READ_ONLY_TITLE)).toBeVisible()
        await expect(
            page.getByRole('main').getByText('Suspendida', { exact: true })
        ).toBeVisible()
    })

    test('el cajero ve el aviso aunque no vea el plan', async ({
        page,
        api,
        signIn,
    }) => {
        mockEmptyBackend(api)
        await signIn({
            role: ROLE.CASHIER,
            subscription: activeSubscription({
                status: 'suspended',
                readOnly: true,
            }),
        })

        await page.goto('/')

        await expect(page.getByText(READ_ONLY_TITLE)).toBeVisible()
        await expect(
            page.getByRole('link', { name: 'Plan y uso' })
        ).toHaveCount(0)
    })
})
