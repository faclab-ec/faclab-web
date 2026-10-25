import type { Permission } from '@/constants/permissions.constant'
import type { RoleCode } from '@/constants/roles.constant'

export type ApiMeta = {
    requestId: string
    timestamp: string
    pagination?: {
        total: number
        limit: number
        offset: number
    }
}

export type ApiEnvelope<T> = {
    data: T
    meta: ApiMeta
}

export type ApiErrorItem = {
    code: string
    message: string
    field?: string | null
}

export type ApiErrorResponse = {
    errors: ApiErrorItem[]
    meta: ApiMeta
}

/** Empresa (un RUC) a la que pertenece el usuario */
export type TenantSummary = {
    id: string
    ruc: string
    legalName: string
    tradeName: string | null
}

/** Empresa elegible al iniciar sesión o al cambiar de empresa */
export type TenantOption = TenantSummary & {
    /** Rol del usuario en esa empresa */
    role: RoleCode
}

/** Sucursal activa a la que el usuario puede entrar */
export type BranchSummary = {
    id: number
    /** Código de establecimiento SRI, de 001 a 999 */
    establishmentCode: string
    name: string
    isMain: boolean
}

export type Session = {
    id: number
    username: string
    /** Nombre con el que firma documentos; null si solo tiene username */
    fullName: string | null
    role: RoleCode
    permissions: Permission[]
    mustChangePassword: boolean
    /** Empresa de la sesión (claim `tid` del token) */
    tenant: TenantSummary
    /** Todas las empresas activas del usuario, la actual incluida */
    tenants: TenantOption[]
    /** Sucursales activas a las que puede entrar, ordenadas por código */
    branches: BranchSummary[]
}

export type LoginRequest = {
    username: string
    password: string
}

/** El refresh token no viene aquí: llega en la cookie HttpOnly `faclab_refresh`. */
export type TokenPair = {
    accessToken: string
    tokenType: 'Bearer'
    expiresIn: number
    tenant: TenantSummary
}

/**
 * Login de un usuario con varias empresas: un token de selección de pocos
 * minutos (sin cookie de refresh) para `POST /api/auth/select-tenant`.
 */
export type TenantSelection = {
    selectionToken: string
    expiresIn: number
    tenants: TenantOption[]
}

export type LoginResponse = TokenPair | TenantSelection

export type SelectTenantRequest = {
    tenantId: string
}

export type RefreshResponse = TokenPair

export type MeResponse = Session

export type ChangePasswordRequest = {
    currentPassword: string
    newPassword: string
}

export type AdminUserResponse = {
    id: number
    username: string
    email: string
    fullName: string | null
    role: RoleCode
    isActive: boolean
    mustChangePassword: boolean
    lastLoginAt: string | null
    createdAt: string
}

export type AdminUserListParams = {
    limit?: number
    offset?: number
    isActive?: boolean
    role?: RoleCode
}

export type CreateUserRequest = {
    username: string
    email: string
    password: string
    role: RoleCode
    fullName?: string | null
}

export type UpdateUserProfileRequest = {
    fullName: string | null
}

export type UpdateUserRoleRequest = {
    role: RoleCode
}

export type ResetUserPasswordRequest = {
    newPassword: string
}
