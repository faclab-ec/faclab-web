import { test, expect } from '../support/test'
import { mockEmptyBackend } from '../fixtures/backend'
import { invoicingReady } from '../fixtures/invoicing'
import { buildSupplier } from '../fixtures/suppliers'
import {
    ADMIN,
    AUTH,
    INVOICING,
    apiError,
    ok,
    paginated,
    type MockApi,
    type MockRequest,
} from '../support/mockApi'
import {
    MAIN_BRANCH,
    OTHER_TENANT,
    REFRESH_COOKIE,
    SECOND_BRANCH,
    TENANT,
    TOKENS,
    buildSession,
} from '../support/session'
import { ROLE } from '@/constants/roles.constant'
import type { TenantSummary } from '@/@types/auth'
import type { Page } from '@playwright/test'

const COMPANIES = [TENANT, OTHER_TENANT]
const TENANTS = [
    { ...TENANT, role: ROLE.ADMIN },
    { ...OTHER_TENANT, role: ROLE.MANAGER },
]

const tokenOf = (tenant: TenantSummary) => `e2e-access-${tenant.ruc}`

const supplierOf = (tenant: TenantSummary) => `Proveedor de ${tenant.legalName}`

/**
 * Un usuario con dos empresas. Cada access token es de una: `/me` y los
 * proveedores responden según el token, y la cookie de refresh sigue a la
 * última empresa elegida, como en faclab-core.
 */
const mockTwoCompanies = (api: MockApi, signedInto: TenantSummary | null) => {
    let cookieTenant = signedInto
    const tenantOf = ({ headers }: MockRequest) =>
        COMPANIES.find((t) => headers.authorization === `Bearer ${tokenOf(t)}`)
    const tokensFor = (tenant: TenantSummary) => ({
        ...ok({ ...TOKENS, accessToken: tokenOf(tenant), tenant }),
        headers: {
            'set-cookie': `${REFRESH_COOKIE}=e2e-refresh-${tenant.ruc}; Path=/api/auth; HttpOnly; SameSite=Strict`,
        },
    })
    const invalidToken = () =>
        apiError(401, 'INVALID_TOKEN', 'Invalid or expired token')

    api.post(`${AUTH}/refresh`, () =>
        cookieTenant ? tokensFor(cookieTenant) : invalidToken()
    )
    api.get(`${AUTH}/me`, (request) => {
        const tenant = tenantOf(request)
        return tenant
            ? ok(
                  buildSession({
                      tenant,
                      tenants: TENANTS,
                      role: TENANTS.find((t) => t.id === tenant.id)?.role,
                  })
              )
            : invalidToken()
    })
    api.post(`${AUTH}/select-tenant`, ({ body }) => {
        const { tenantId } = body as { tenantId: string }
        const tenant = COMPANIES.find((t) => t.id === tenantId)
        if (!tenant)
            return apiError(403, 'TENANT_ACCESS_DENIED', 'Tenant access denied')
        cookieTenant = tenant
        return tokensFor(tenant)
    })
    api.get(`${INVOICING}/invoicing/status`, () => ok(invoicingReady()))
    api.get(`${ADMIN}/suppliers`, (request) => {
        const tenant = tenantOf(request)
        return paginated(
            tenant ? [buildSupplier({ name: supplierOf(tenant) })] : [],
            request.query
        )
    })
}

const submitCredentials = async (page: Page) => {
    await page.getByLabel('Usuario', { exact: true }).fill('contador')
    await page.getByLabel('Contraseña', { exact: true }).fill('secreto-123')
    await page.getByRole('button', { name: 'Ingresar' }).click()
}

const mainNav = (page: Page) =>
    page.getByRole('navigation', { name: 'Navegación principal' })

test.describe('Empresas', () => {
    test('con dos empresas elige una al iniciar sesión', async ({
        page,
        api,
    }) => {
        mockEmptyBackend(api)
        mockTwoCompanies(api, null)
        // Sin cookie: el token de selección solo sirve para elegir
        api.post(`${AUTH}/login`, () =>
            ok({
                selectionToken: 'e2e-selection',
                expiresIn: 300,
                tenants: TENANTS,
            })
        )

        await page.goto('/sign-in')
        await submitCredentials(page)

        await expect(
            page.getByRole('heading', { name: 'Elige la empresa' })
        ).toBeVisible()
        await page
            .getByRole('list', { name: 'Empresas' })
            .getByRole('button', { name: /Comercial La Tuerca/ })
            .click()

        await expect(page).toHaveURL(/\/home$/)
        const [selection] = api.callsTo('POST', `${AUTH}/select-tenant`)
        expect(selection.headers.authorization).toBe('Bearer e2e-selection')
        expect(selection.body).toEqual({ tenantId: OTHER_TENANT.id })

        await page.getByRole('button', { name: 'Menú de usuario' }).click()
        await expect(page.getByRole('menu')).toContainText(
            OTHER_TENANT.legalName
        )
        // El token de selección nunca llega al almacenamiento del navegador
        expect(
            await page.evaluate(() =>
                JSON.stringify([
                    Object.entries(window.localStorage),
                    Object.entries(window.sessionStorage),
                ])
            )
        ).not.toContain('e2e-selection')
    })

    test('si la elección vence vuelve a pedir las credenciales', async ({
        page,
        api,
    }) => {
        mockEmptyBackend(api)
        mockTwoCompanies(api, null)
        api.post(`${AUTH}/login`, () =>
            ok({
                selectionToken: 'e2e-selection',
                expiresIn: 300,
                tenants: TENANTS,
            })
        )
        api.post(`${AUTH}/select-tenant`, () =>
            apiError(401, 'TOKEN_EXPIRED', 'Token has expired')
        )

        await page.goto('/sign-in')
        await submitCredentials(page)
        await page
            .getByRole('list', { name: 'Empresas' })
            .getByRole('button', { name: /El Tornillo/ })
            .click()

        await expect(
            page.getByText('La elección de empresa venció')
        ).toBeVisible()
        await expect(
            page.getByRole('button', { name: 'Ingresar' })
        ).toBeVisible()
        // No intentó renovar con una cookie que no es de esta selección
        expect(api.callsTo('POST', `${AUTH}/refresh`)).toHaveLength(0)
    })

    test('cambia de empresa sin cerrar sesión y ve solo sus datos', async ({
        page,
        api,
        signIn,
    }) => {
        mockEmptyBackend(api)
        await signIn({ tenants: TENANTS })
        mockTwoCompanies(api, TENANT)

        await page.goto('/suppliers')
        await expect(page.getByText(supplierOf(TENANT))).toBeVisible()

        await page.getByRole('button', { name: 'Menú de usuario' }).click()
        await page.getByRole('menuitem', { name: 'Cambiar empresa' }).click()
        await page
            .getByRole('dialog', { name: 'Cambiar empresa' })
            .getByRole('button', { name: /Comercial La Tuerca/ })
            .click()

        await expect(page).toHaveURL(/\/home$/)
        const [change] = api.callsTo('POST', `${AUTH}/select-tenant`)
        expect(change.headers.authorization).toBe(`Bearer ${tokenOf(TENANT)}`)
        expect(change.body).toEqual({ tenantId: OTHER_TENANT.id })

        // Sin recargar: lo que se había cargado de la otra empresa no reaparece
        await mainNav(page).getByRole('link', { name: 'Proveedores' }).click()
        await expect(page.getByText(supplierOf(OTHER_TENANT))).toBeVisible()
        await expect(page.getByText(supplierOf(TENANT))).toHaveCount(0)
    })

    test('con una sola empresa no ofrece cambiarla', async ({
        page,
        api,
        signIn,
    }) => {
        mockEmptyBackend(api)
        await signIn()
        await page.goto('/home')

        await page.getByRole('button', { name: 'Menú de usuario' }).click()
        await expect(page.getByRole('menu')).toContainText('El Tornillo')
        await expect(
            page.getByRole('menuitem', { name: 'Cambiar empresa' })
        ).toHaveCount(0)
    })
})

test.describe('Sucursales', () => {
    test('el selector cambia la sucursal de las llamadas y la recuerda', async ({
        page,
        api,
        signIn,
    }) => {
        mockEmptyBackend(api)
        await signIn({ branches: [MAIN_BRANCH, SECOND_BRANCH] })

        await page.goto('/suppliers')
        await expect(
            page.getByRole('heading', { name: 'Proveedores', exact: true })
        ).toBeVisible()
        const [first] = api.callsTo('GET', `${ADMIN}/suppliers`)
        expect(first.headers['x-branch-id']).toBe('1')
        // Ni auth ni facturación llevan la sucursal
        for (const call of [
            ...api.callsTo('GET', `${AUTH}/me`),
            ...api.callsTo('GET', `${INVOICING}/invoicing/status`),
        ]) {
            expect(call.headers['x-branch-id']).toBeUndefined()
        }

        await page
            .getByRole('button', { name: 'Sucursal: 001 · Matriz' })
            .click()
        await page
            .getByRole('menuitem', { name: '002 · Sucursal Norte' })
            .click()
        await expect(
            page.getByRole('button', { name: 'Sucursal: 002 · Sucursal Norte' })
        ).toBeVisible()

        // Recordada en este navegador
        await page.reload()
        await expect(
            page.getByRole('heading', { name: 'Proveedores', exact: true })
        ).toBeVisible()
        const calls = api.callsTo('GET', `${ADMIN}/suppliers`)
        expect(calls.at(-1)?.headers['x-branch-id']).toBe('2')
    })

    test('un cajero con una sola sucursal no ve otras', async ({
        page,
        api,
        signIn,
    }) => {
        mockEmptyBackend(api)
        await signIn({
            role: ROLE.CASHIER,
            username: 'caja1',
            branches: [SECOND_BRANCH],
        })
        await page.goto('/home')

        // La muestra, pero no hay nada que elegir
        await expect(
            page.getByTitle('Sucursal 002 · Sucursal Norte')
        ).toBeVisible()
        await expect(
            page.getByRole('button', { name: /^Sucursal:/ })
        ).toHaveCount(0)
        await expect(page.getByText('Matriz')).toHaveCount(0)
    })
})
