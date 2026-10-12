import { test, expect } from '../support/test'
import { mockEmptyBackend } from '../fixtures/backend'
import { mockSuppliers } from '../fixtures/suppliers'
import { ADMIN, AUTH, POS, apiError, noContent, ok } from '../support/mockApi'
import {
    TOKENS,
    buildSession,
    mockSessionEndpoints,
    type SessionOptions,
} from '../support/session'
import { ROLE } from '@/constants/roles.constant'
import type { MockApi } from '../support/mockApi'
import type { Page } from '@playwright/test'

/** El backend acepta las credenciales y devuelve la sesión indicada. */
const acceptLogin = (api: MockApi, options: SessionOptions = {}) => {
    api.post(`${AUTH}/login`, () => ok(TOKENS))
    mockSessionEndpoints(api, buildSession(options))
}

const submitCredentials = async (page: Page) => {
    await page.getByLabel('Usuario', { exact: true }).fill('admin')
    await page.getByLabel('Contraseña', { exact: true }).fill('secreto-123')
    await page.getByRole('button', { name: 'Ingresar' }).click()
}

test.describe('Inicio de sesión', () => {
    test('con credenciales válidas entra al resumen', async ({ page, api }) => {
        mockEmptyBackend(api)
        acceptLogin(api)

        await page.goto('/sign-in')
        await submitCredentials(page)

        await expect(page).toHaveURL(/\/home$/)
        await expect(
            page.getByRole('heading', { name: 'Resumen', exact: true })
        ).toBeVisible()
        expect(api.callsTo('POST', `${AUTH}/login`)[0].body).toEqual({
            username: 'admin',
            password: 'secreto-123',
        })
    })

    test('con credenciales inválidas muestra el error del servidor', async ({
        page,
        api,
    }) => {
        api.post(`${AUTH}/login`, () =>
            apiError(
                400,
                'INVALID_CREDENTIALS',
                'Usuario o contraseña inválidos'
            )
        )

        await page.goto('/sign-in')
        await submitCredentials(page)

        await expect(page.getByRole('alert')).toContainText(
            'Usuario o contraseña inválidos'
        )
        await expect(page).toHaveURL(/\/sign-in/)
    })

    test('no envía el formulario con campos vacíos', async ({ page, api }) => {
        await page.goto('/sign-in')
        await page.getByRole('button', { name: 'Ingresar' }).click()

        await expect(page.getByText('Ingresa tu usuario')).toBeVisible()
        await expect(page.getByText('Ingresa tu contraseña')).toBeVisible()
        await expect(
            page.getByLabel('Usuario', { exact: true })
        ).toHaveAttribute('aria-invalid', 'true')
        expect(api.callsTo('POST', `${AUTH}/login`)).toHaveLength(0)
    })

    test('permite ver y ocultar la contraseña', async ({ page }) => {
        await page.goto('/sign-in')
        const password = page.getByLabel('Contraseña', { exact: true })
        await password.fill('secreto-123')

        await page.getByRole('button', { name: 'Mostrar contraseña' }).click()
        await expect(password).toHaveAttribute('type', 'text')

        await page.getByRole('button', { name: 'Ocultar contraseña' }).click()
        await expect(password).toHaveAttribute('type', 'password')
    })

    test('un cajero entra directo al punto de venta', async ({ page, api }) => {
        acceptLogin(api, { role: ROLE.CASHIER, username: 'caja1' })
        api.get(`${POS}/shifts/active`, () => ok(null))

        await page.goto('/sign-in')
        await submitCredentials(page)

        await expect(page).toHaveURL(/\/pos$/)
        await expect(
            page.getByRole('heading', { name: 'Abrir turno' })
        ).toBeVisible()
    })

    test('obliga a cambiar la contraseña cuando el backend lo exige', async ({
        page,
        api,
    }) => {
        acceptLogin(api, { mustChangePassword: true })

        await page.goto('/sign-in')
        await submitCredentials(page)

        await expect(page).toHaveURL(/\/change-password$/)
        await expect(
            page.getByRole('heading', {
                name: 'Cambia tu contraseña para continuar',
            })
        ).toBeVisible()
    })
})

test.describe('Rutas protegidas', () => {
    test('sin sesión redirige al inicio de sesión y vuelve a la ruta pedida', async ({
        page,
        api,
    }) => {
        mockSuppliers(api)
        acceptLogin(api)

        await page.goto('/suppliers')
        await expect(page).toHaveURL(/\/sign-in\?redirectUrl=\/suppliers$/)

        await submitCredentials(page)

        await expect(page).toHaveURL(/\/suppliers$/)
        await expect(
            page.getByRole('heading', { name: 'Proveedores', exact: true })
        ).toBeVisible()
    })

    test('ignora un redirectUrl que apunta fuera de la app', async ({
        page,
        api,
    }) => {
        mockEmptyBackend(api)
        acceptLogin(api)

        await page.goto('/sign-in?redirectUrl=//evil.example/robo')
        await submitCredentials(page)

        await expect(page).toHaveURL(/127\.0\.0\.1:\d+\/home$/)
    })

    test('cierra la sesión local cuando el backend rechaza el token', async ({
        page,
        api,
        signIn,
    }) => {
        await signIn()
        api.get(`${ADMIN}/suppliers`, () =>
            apiError(401, 'INVALID_TOKEN', 'Token inválido')
        )

        await page.goto('/suppliers')

        await expect(page).toHaveURL(/\/sign-in/)
        await expect(
            page.getByRole('heading', { name: 'Bienvenido' })
        ).toBeVisible()
    })
})

test.describe('Cierre de sesión', () => {
    test('revoca la sesión en el servidor y vuelve al inicio de sesión', async ({
        page,
        api,
        signIn,
    }) => {
        mockEmptyBackend(api)
        await signIn({ username: 'gerente' })
        api.post(`${AUTH}/logout`, () => noContent())

        await page.goto('/home')
        await page.getByRole('button', { name: 'Menú de usuario' }).click()
        await expect(page.getByRole('menu')).toContainText('gerente')
        await page.getByRole('menuitem', { name: 'Cerrar sesión' }).click()

        await expect(page).toHaveURL(/\/sign-in/)
        expect(api.callsTo('POST', `${AUTH}/logout`)[0].body).toEqual({
            refreshToken: TOKENS.refreshToken,
        })

        // La sesión no vuelve al recargar
        await page.reload()
        await expect(page).toHaveURL(/\/sign-in/)
    })
})
