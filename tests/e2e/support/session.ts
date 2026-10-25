import type { Page } from '@playwright/test'
import type {
    BranchSummary,
    Session,
    TenantOption,
    TenantSummary,
    TokenPair,
} from '@/@types/auth'
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
    fullName?: string | null
    mustChangePassword?: boolean
    /** Empresa de la sesión; por defecto `TENANT` */
    tenant?: TenantSummary
    /** Empresas del usuario; por defecto solo la de la sesión */
    tenants?: TenantOption[]
    /** Sucursales a las que puede entrar; por defecto solo la matriz */
    branches?: BranchSummary[]
    /** Caja que este navegador ya tenía vinculada (`fc.workplace`) */
    terminal?: { branchId: number; terminalId: number }
}

export const TENANT: TenantSummary = {
    id: '6f1c2a4e-1b7d-4c55-9a39-0d1e2f3a4b5c',
    ruc: '0190000000001',
    legalName: 'Ferretería El Tornillo S.A.',
    tradeName: 'El Tornillo',
}

export const OTHER_TENANT: TenantSummary = {
    id: '9a8b7c6d-5e4f-4a3b-8c2d-1e0f9a8b7c6d',
    ruc: '0190000000002',
    legalName: 'Comercial La Tuerca Cía. Ltda.',
    tradeName: null,
}

export const MAIN_BRANCH: BranchSummary = {
    id: 1,
    establishmentCode: '001',
    name: 'Matriz',
    isMain: true,
}

export const SECOND_BRANCH: BranchSummary = {
    id: 2,
    establishmentCode: '002',
    name: 'Sucursal Norte',
    isMain: false,
}

// El refresh token no viaja en el cuerpo: el backend lo deja en esta cookie
export const REFRESH_COOKIE = 'faclab_refresh'

export const TOKENS: TokenPair = {
    accessToken: 'e2e-access-token',
    tokenType: 'Bearer',
    // Lejos del margen de 60 s del refresco proactivo
    expiresIn: 3600,
    tenant: TENANT,
}

export const buildSession = (options: SessionOptions = {}): Session => {
    const role = options.role ?? ROLE.ADMIN
    const tenant = options.tenant ?? TENANT

    return {
        id: 1,
        username: options.username ?? 'admin',
        fullName: options.fullName ?? null,
        role,
        permissions: options.permissions ?? ROLE_PERMISSIONS[role],
        mustChangePassword: options.mustChangePassword ?? false,
        tenant,
        tenants: options.tenants ?? [{ ...tenant, role }],
        branches: options.branches ?? [MAIN_BRANCH],
    }
}

/**
 * Llamadas que hace el layout con cualquier sesión iniciada. Una prueba puede
 * volver a registrar cualquiera de ellas: gana el último handler.
 */
export const mockSessionEndpoints = (api: MockApi, session: Session): void => {
    // Al cargar la página el access token no existe (vive en memoria): la app
    // lo pide con la cookie de refresh
    api.post(`${AUTH}/refresh`, () => ok(TOKENS))
    api.get(`${AUTH}/me`, () => ok(session))
    api.get(`${INVOICING}/invoicing/status`, () => ok(invoicingReady()))
}

/**
 * Entra con la sesión ya iniciada, como si el usuario volviera a abrir la
 * pestaña: deja la marca de sesión (no hay tokens en el navegador) y la app
 * recupera el access token con el refresh simulado.
 */
export const signInAs = async (
    page: Page,
    api: MockApi,
    options: SessionOptions = {}
): Promise<Session> => {
    const session = buildSession(options)
    mockSessionEndpoints(api, session)

    const workplace = options.terminal
        ? JSON.stringify({
              state: {
                  branchByTenant: {},
                  terminalByBranch: {
                      [`${session.tenant.id}:${options.terminal.branchId}`]:
                          options.terminal.terminalId,
                  },
              },
              version: 1,
          })
        : null

    await page.addInitScript((workplace) => {
        // Una sola vez por pestaña: si la prueba cierra sesión y recarga, la
        // sesión no debe reaparecer.
        if (window.sessionStorage.getItem('e2e.seeded')) return
        window.sessionStorage.setItem('e2e.seeded', '1')
        window.localStorage.setItem('fc.hasSession', '1')
        if (workplace) window.localStorage.setItem('fc.workplace', workplace)
    }, workplace)

    return session
}
