import { test, expect } from '../support/test'
import { mockEmptyBackend } from '../fixtures/backend'
import { buildBranch, mockOrganization } from '../fixtures/organization'
import { ADMIN, apiError, ok, paginated } from '../support/mockApi'
import { ROLE } from '@/constants/roles.constant'
import type { AdminUserResponse } from '@/@types/auth'

test.describe('Sucursales', () => {
    test('crea una sucursal con su punto de emisión y su caja', async ({
        page,
        api,
        signIn,
    }) => {
        mockEmptyBackend(api)
        await signIn()
        mockOrganization(api)

        await page.goto('/settings/branches')
        await expect(page.getByRole('link', { name: 'Matriz' })).toBeVisible()

        await page.getByRole('button', { name: 'Nueva sucursal' }).click()
        const branchDialog = page.getByRole('dialog', {
            name: 'Nueva sucursal',
        })
        await branchDialog
            .getByRole('textbox', { name: /^Establecimiento/ })
            .fill('002')
        await branchDialog.getByLabel('Nombre', { exact: true }).fill('Norte')
        await branchDialog
            .getByLabel('Dirección del establecimiento')
            .fill('Av. Ordóñez Lasso 4-56')
        await branchDialog.getByRole('button', { name: 'Guardar' }).click()

        await expect(branchDialog).toBeHidden()
        expect(api.callsTo('POST', `${ADMIN}/branches`)[0].body).toEqual({
            establishmentCode: '002',
            name: 'Norte',
            address: 'Av. Ordóñez Lasso 4-56',
            isActive: true,
        })

        await page.getByRole('link', { name: 'Norte' }).click()
        await expect(
            page.getByRole('heading', { name: '002 · Norte' })
        ).toBeVisible()

        await page
            .getByRole('button', { name: 'Nuevo punto de emisión' })
            .click()
        const pointDialog = page.getByRole('dialog', {
            name: 'Nuevo punto de emisión',
        })
        await pointDialog.getByLabel('Código').fill('001')
        await pointDialog.getByRole('button', { name: 'Guardar' }).click()
        await expect(pointDialog).toBeHidden()
        // La sucursal la pone la página
        expect(api.callsTo('POST', `${ADMIN}/emission-points`)[0].body).toEqual(
            { code: '001', name: null, isActive: true, branchId: 2 }
        )

        await page.getByRole('button', { name: 'Nueva caja' }).click()
        const terminalDialog = page.getByRole('dialog', { name: 'Nueva caja' })
        await terminalDialog.getByLabel('Código').fill('NORTE-01')
        await terminalDialog
            .getByLabel('Nombre', { exact: true })
            .fill('Caja Norte')
        // El único punto de emisión de la sucursal ya viene elegido; la
        // ubicación es de la bodega de esta sucursal
        await terminalDialog.getByLabel('Ubicación de stock').click()
        await page
            .getByRole('option', { name: 'BOD-002 › A1 · Almacén principal' })
            .click()
        await terminalDialog.getByRole('button', { name: 'Guardar' }).click()

        await expect(terminalDialog).toBeHidden()
        expect(api.callsTo('POST', `${ADMIN}/pos-terminals`)[0].body).toEqual({
            code: 'NORTE-01',
            name: 'Caja Norte',
            emissionPointId: 2,
            defaultLocationId: 20,
            isActive: true,
            branchId: 2,
        })
        await expect(
            page.getByRole('cell', { name: 'NORTE-01', exact: true })
        ).toBeVisible()
    })

    test('un código de establecimiento repetido se explica', async ({
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
                'BRANCH_ESTABLISHMENT_CODE_ALREADY_EXISTS',
                'Branch with establishment code 001 already exists'
            )
        )

        await page.goto('/settings/branches')
        await page.getByRole('button', { name: 'Nueva sucursal' }).click()
        const dialog = page.getByRole('dialog', { name: 'Nueva sucursal' })
        await dialog
            .getByRole('textbox', { name: /^Establecimiento/ })
            .fill('001')
        await dialog.getByLabel('Nombre', { exact: true }).fill('Otra')
        await dialog.getByRole('button', { name: 'Guardar' }).click()

        await expect(
            page.getByText(
                'Ya existe una sucursal con ese código de establecimiento.'
            )
        ).toBeVisible()
        await expect(dialog).toBeVisible()
    })

    test('quien solo consulta ve las sucursales sin poder cambiarlas', async ({
        page,
        api,
        signIn,
    }) => {
        mockEmptyBackend(api)
        await signIn({ role: ROLE.VIEWER })
        mockOrganization(api)

        await page.goto('/settings/branches')
        await expect(page.getByRole('link', { name: 'Matriz' })).toBeVisible()
        await expect(
            page.getByRole('button', { name: 'Nueva sucursal' })
        ).toHaveCount(0)
        await expect(
            page.getByRole('button', { name: 'Editar Matriz' })
        ).toHaveCount(0)
    })
})

test.describe('Accesos por sucursal', () => {
    const cashier: AdminUserResponse = {
        id: 2,
        username: 'caja1',
        email: 'caja1@eltornillo.ec',
        fullName: 'Ana Cajera',
        role: ROLE.CASHIER,
        isActive: true,
        mustChangePassword: false,
        lastLoginAt: null,
        createdAt: '2026-01-10T10:00:00.000Z',
    }

    test('limita a un usuario a una sucursal', async ({
        page,
        api,
        signIn,
    }) => {
        mockEmptyBackend(api)
        await signIn()
        mockOrganization(api, {
            branches: [
                buildBranch(),
                buildBranch({
                    id: 2,
                    establishmentCode: '002',
                    name: 'Norte',
                    isMain: false,
                }),
            ],
        })
        api.get(`${ADMIN}/users`, ({ query }) => paginated([cashier], query))
        api.get(`${ADMIN}/users/:id/branches`, ({ params }) =>
            ok({ userId: Number(params.id), branchIds: [] })
        )
        api.put(`${ADMIN}/users/:id/branches`, ({ params, body }) =>
            ok({ userId: Number(params.id), ...(body as object) })
        )

        await page.goto('/settings/users')
        await page.getByRole('button', { name: 'Sucursales' }).click()
        const dialog = page.getByRole('dialog', {
            name: 'Sucursales de Ana Cajera',
        })
        const all = dialog.getByRole('switch', { name: /Todas las sucursales/ })
        await expect(all).toBeChecked()

        await dialog.getByText('Todas las sucursales').click()
        await expect(all).not.toBeChecked()
        // Sin ninguna elegida no se guarda
        await dialog.getByRole('button', { name: 'Guardar' }).click()
        await expect(dialog.getByRole('alert')).toHaveText(
            'Elige al menos una sucursal'
        )

        await dialog.getByRole('checkbox', { name: '002 · Norte' }).check()
        await dialog.getByRole('button', { name: 'Guardar' }).click()

        await expect(dialog).toBeHidden()
        const [update] = api.callsTo('PUT', `${ADMIN}/users/2/branches`)
        expect(update.body).toEqual({ branchIds: [2] })
    })
})
