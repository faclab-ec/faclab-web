import type { Page } from '@playwright/test'
import type { LoginResponse, Session } from '@/@types/auth'
import {
    ROLE_PERMISSIONS,
    type Permission,
} from '@/constants/permissions.constant'
import { ROLE, type RoleCode } from '@/constants/roles.constant'
import { AUTH, INVOICING, ok, type MockApi } from './mockApi'
import { invoicingReady } from '../fixtures/invoicing'

export interface SessionOptions {
    role?: RoleCode
    /** Por defecto, los permisos del rol según `ROLE_PERMISSIONS`. */
    permissions?: Permission[]
    username?: string
    mustChangePassword?: boolean
}

export const TOKENS: LoginResponse = {
    accessToken: 'e2e-access-token',
    refreshToken: 'e2e-refresh-token',
    tokenType: 'Bearer',
    // Lejos del margen de 60 s del refresco proactivo
    expiresIn: 3600,
}

export const buildSession = (options: SessionOptions = {}): Session => {
    const role = options.role ?? ROLE.ADMIN

    return {
        id: 1,
        username: options.username ?? 'admin',
        role,
        permissions: options.permissions ?? ROLE_PERMISSIONS[role],
        mustChangePassword: options.mustChangePassword ?? false,
    }
}

/**
 * Llamadas que hace el layout con cualquier sesión iniciada. Una prueba puede
 * volver a registrar cualquiera de ellas: gana el último handler.
 */
export const mockSessionEndpoints = (api: MockApi, session: Session): void => {
    api.get(`${AUTH}/me`, () => ok(session))
    api.get(`${INVOICING}/invoicing/status`, () => ok(invoicingReady()))
}

/**
 * Entra con la sesión ya iniciada: deja los tokens en localStorage antes de
 * que cargue la app, como si el usuario hubiera vuelto a abrir la pestaña.
 */
export const signInAs = async (
    page: Page,
    api: MockApi,
    options: SessionOptions = {}
): Promise<Session> => {
    const session = buildSession(options)
    mockSessionEndpoints(api, session)

    await page.addInitScript((tokens) => {
        // Una sola vez por pestaña: si la prueba cierra sesión y recarga, la
        // sesión no debe reaparecer.
        if (window.sessionStorage.getItem('e2e.seeded')) return
        window.sessionStorage.setItem('e2e.seeded', '1')
        window.localStorage.setItem('fc.access', tokens.accessToken)
        window.localStorage.setItem('fc.refresh', tokens.refreshToken)
        window.localStorage.setItem(
            'fc.accessExpiresAt',
            String(Date.now() + tokens.expiresIn * 1000)
        )
    }, TOKENS)

    return session
}
