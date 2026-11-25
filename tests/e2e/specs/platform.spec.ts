import { test, expect } from '../support/test'
import { apiError, created, ok, CORE } from '../support/mockApi'

const PLATFORM = `${CORE}/platform`

const tenant = (overrides: Record<string, unknown> = {}) => ({
    id: '6f1c2a4e-1b7d-4c55-9a39-0d1e2f3a4b5c',
    ruc: '0190000000001',
    legalName: 'Ferretería El Tornillo S.A.',
    tradeName: 'El Tornillo',
    status: 'active',
    createdAt: '2026-01-10T10:00:00.000Z',
    subscriptionStatus: 'active',
    trialEndsAt: null,
    plan: { code: 'basico', name: 'Básico' },
    activeUsers: 2,
    activeBranches: 1,
    ...overrides,
})

const detail = (overrides: Record<string, unknown> = {}) => ({
    ...tenant(overrides),
    invoicing: {
        pendingInvoices: 1,
        rejectedInvoices: 0,
        authorizedInvoices: 42,
        uninvoicedSales: 3,
        openDiscrepancies: 0,
        documentsThisMonth: 17,
    },
    subscription: {
        plan: { code: 'basico', name: 'Básico' },
        status: 'active',
        readOnly: false,
        resources: [{ resource: 'branches', used: 1, limit: 1 }],
    },
})

const loginOk = () =>
    ok({
        accessToken: 'platform-token',
        expiresIn: 900,
        tokenType: 'Bearer',
        username: 'ops',
        displayName: 'Operadora Uno',
    })

test.describe('Consola de plataforma', () => {
    test('sin ingresar lleva al ingreso de la plataforma', async ({ page }) => {
        await page.goto('/platform/tenants')

        await expect(page).toHaveURL(/\/platform\/sign-in$/)
        await expect(
            page.getByRole('heading', { name: 'Consola de plataforma' })
        ).toBeVisible()
    })

    test('un usuario que no es operador no entra', async ({ page, api }) => {
        api.post(`${PLATFORM}/auth/login`, () =>
            apiError(401, 'INVALID_CREDENTIALS', 'invalid username or password')
        )

        await page.goto('/platform/sign-in')
        await page.getByLabel('Usuario').fill('ana')
        await page.getByLabel('Contraseña', { exact: true }).fill('secreta-123')
        await page.getByRole('button', { name: 'Ingresar' }).click()

        await expect(
            page.getByText('Usuario o contraseña incorrectos.')
        ).toBeVisible()
        await expect(page).toHaveURL(/\/platform\/sign-in$/)
    })

    test('lista, crea y suspende empresas con el token de plataforma', async ({
        page,
        api,
    }) => {
        let status = 'active'
        api.post(`${PLATFORM}/auth/login`, loginOk)
        api.get(`${PLATFORM}/plans`, () =>
            ok([
                { code: 'ilimitado', name: 'Sin límites' },
                { code: 'basico', name: 'Básico' },
            ])
        )
        api.get(`${PLATFORM}/tenants`, () =>
            ok({ items: [tenant({ status })], total: 1, limit: 20, offset: 0 })
        )
        api.get(`${PLATFORM}/tenants/:id`, () => ok(detail({ status })))
        api.post(`${PLATFORM}/tenants`, () =>
            created({
                tenantId: '9a8b7c6d-5e4f-4a3b-8c2d-1e0f9a8b7c6d',
                tenantCreated: true,
                userCreated: true,
                adminPassword: 'Temporal-1234',
            })
        )
        api.post(`${PLATFORM}/tenants/:id/suspend`, () => {
            status = 'suspended'
            return ok({ status: 'suspended', revokedSessions: 2 })
        })

        await page.goto('/platform/sign-in')
        await page.getByLabel('Usuario').fill('ops')
        await page
            .getByLabel('Contraseña', { exact: true })
            .fill('operador-123')
        await page.getByRole('button', { name: 'Ingresar' }).click()

        // La lista, con el token de plataforma (no el de una empresa)
        await expect(page).toHaveURL(/\/platform\/tenants$/)
        await expect(page.getByText('Operadora Uno')).toBeVisible()
        await expect(
            page.getByRole('button', { name: 'El Tornillo' })
        ).toBeVisible()
        expect(
            api.callsTo('GET', `${PLATFORM}/tenants`)[0].headers.authorization
        ).toBe('Bearer platform-token')

        // Alta: la contraseña temporal se muestra una vez
        await page.getByRole('button', { name: 'Nueva empresa' }).click()
        const dialog = page.getByRole('dialog', { name: 'Nueva empresa' })
        await dialog.getByLabel('RUC').fill('0990000000001')
        await dialog.getByLabel('Razón social').fill('Ferretería Nueva S.A.')
        await dialog.getByLabel('Usuario del administrador').fill('nueva-admin')
        await dialog
            .getByLabel('Correo del administrador')
            .fill('admin@nueva.test')
        await dialog.getByRole('button', { name: 'Crear empresa' }).click()
        await expect(dialog).toContainText('Temporal-1234')
        expect(
            api.callsTo('POST', `${PLATFORM}/tenants`)[0].body
        ).toMatchObject({
            ruc: '0990000000001',
            adminUsername: 'nueva-admin',
        })
        await dialog.getByRole('button', { name: 'Listo' }).click()

        // Detalle y suspensión con confirmación
        await page.getByRole('button', { name: 'El Tornillo' }).click()
        await expect(page.getByText('Facturas autorizadas')).toBeVisible()
        await expect(page.getByText('42')).toBeVisible()
        await page.getByRole('button', { name: 'Suspender empresa' }).click()
        const confirm = page.getByRole('dialog', {
            name: 'Suspender la empresa',
        })
        await confirm
            .getByPlaceholder('Motivo (opcional)')
            .fill('falta de pago')
        await confirm.getByRole('button', { name: 'Suspender' }).click()

        await expect(
            page.getByRole('button', { name: 'Reactivar empresa' })
        ).toBeVisible()
        expect(
            api.callsTo('POST', `${PLATFORM}/tenants/:id/suspend`)[0].body
        ).toEqual({ reason: 'falta de pago' })
    })
})
