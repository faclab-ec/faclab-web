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

export type Session = {
    id: number
    username: string
    /** Nombre con el que firma documentos; null si solo tiene username */
    fullName: string | null
    role: RoleCode
    permissions: Permission[]
    mustChangePassword: boolean
}

export type LoginRequest = {
    username: string
    password: string
}

/** El refresh token no viene aquí: llega en la cookie HttpOnly `faclab_refresh`. */
export type LoginResponse = {
    accessToken: string
    tokenType: 'Bearer'
    expiresIn: number
}

export type RefreshResponse = LoginResponse

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
