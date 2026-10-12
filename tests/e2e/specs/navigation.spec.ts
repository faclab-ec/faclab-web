import { test, expect } from '../support/test'
import { mockEmptyBackend } from '../fixtures/backend'
import { POS, ok } from '../support/mockApi'
import { ROLE } from '@/constants/roles.constant'
import type { Page } from '@playwright/test'

const mainNav = (page: Page) =>
    page.getByRole('navigation', { name: 'Navegación principal' })

test.describe('Navegación', () => {
    test.beforeEach(({ api }) => {
        mockEmptyBackend(api)
    })

    test('el menú lateral lleva a cada módulo y marca la página actual', async ({
        page,
        signIn,
    }) => {
        await signIn()
        await page.goto('/home')

        const nav = mainNav(page)
        await expect(nav.getByRole('link', { name: 'Inicio' })).toHaveAttribute(
            'aria-current',
            'page'
        )

        await nav.getByRole('link', { name: 'Proveedores' }).click()
        await expect(page).toHaveURL(/\/suppliers$/)
        await expect(
            page.getByRole('heading', { name: 'Proveedores', exact: true })
        ).toBeVisible()
        await expect(
            nav.getByRole('link', { name: 'Proveedores' })
        ).toHaveAttribute('aria-current', 'page')
        await expect(
            nav.getByRole('link', { name: 'Inicio' })
        ).not.toHaveAttribute('aria-current', 'page')

        await nav.getByRole('link', { name: 'Productos' }).click()
        await expect(page).toHaveURL(/\/catalog\/products$/)
        await expect(
            page.getByRole('heading', { name: 'Productos', exact: true })
        ).toBeVisible()
    })

    test('el menú se puede colapsar y la preferencia se conserva', async ({
        page,
        signIn,
    }) => {
        await signIn()
        await page.goto('/home')

        const nav = mainNav(page)
        await expect(nav.getByText('Catálogo')).toBeVisible()

        await page.getByRole('button', { name: 'Contraer menú' }).click()
        await expect(nav.getByText('Catálogo')).toBeHidden()
        // Colapsado sigue siendo navegable: los enlaces conservan su nombre
        await expect(
            nav.getByRole('link', { name: 'Proveedores' })
        ).toBeVisible()

        await page.reload()
        await expect(
            page.getByRole('button', { name: 'Expandir menú' })
        ).toBeVisible()
    })

    test('una ruta inexistente vuelve al inicio', async ({ page, signIn }) => {
        await signIn()
        await page.goto('/esta-ruta-no-existe')

        await expect(page).toHaveURL(/\/home$/)
        await expect(
            page.getByRole('heading', { name: 'Resumen', exact: true })
        ).toBeVisible()
    })

    test('el botón POS de la cabecera abre el punto de venta', async ({
        page,
        api,
        signIn,
    }) => {
        api.get(`${POS}/shifts/active`, () => ok(null))
        await signIn()
        await page.goto('/home')

        await page.getByRole('button', { name: 'POS' }).click()

        await expect(page).toHaveURL(/\/pos$/)
    })
})

test.describe('Permisos', () => {
    test.beforeEach(({ api }) => {
        mockEmptyBackend(api)
    })

    test('el menú solo muestra lo que el rol puede ver', async ({
        page,
        signIn,
    }) => {
        await signIn({ role: ROLE.VIEWER, username: 'consulta' })
        await page.goto('/home')

        const nav = mainNav(page)
        await expect(nav.getByRole('link', { name: 'Productos' })).toBeVisible()
        await expect(nav.getByRole('link', { name: 'Usuarios' })).toHaveCount(0)
        await expect(nav.getByRole('link', { name: 'Ajustes' })).toHaveCount(0)
        await expect(page.getByRole('button', { name: 'POS' })).toHaveCount(0)
    })

    test('una ruta sin permiso muestra "Sin acceso" y permite volver', async ({
        page,
        signIn,
    }) => {
        await signIn({ role: ROLE.VIEWER, username: 'consulta' })
        await page.goto('/settings/users')

        await expect(page).toHaveURL(/\/access-denied$/)
        await expect(
            page.getByRole('heading', { name: 'Sin acceso' })
        ).toBeVisible()

        await page.getByRole('button', { name: 'Volver al inicio' }).click()
        await expect(page).toHaveURL(/\/home$/)
    })
})

test.describe('Tema', () => {
    test('cambia a modo oscuro y lo recuerda al recargar', async ({
        page,
        api,
        signIn,
    }) => {
        mockEmptyBackend(api)
        await signIn()
        await page.goto('/home')
        const html = page.locator('html')
        await expect(html).toHaveClass(/\blight\b/)

        await page
            .getByRole('button', { name: 'Cambiar a modo oscuro' })
            .click()
        await expect(html).toHaveClass(/\bdark\b/)

        await page.reload()
        await expect(html).toHaveClass(/\bdark\b/)
        await expect(
            page.getByRole('button', { name: 'Cambiar a modo claro' })
        ).toBeVisible()
    })
})
