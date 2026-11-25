import type { StatusTone } from '@shared/lib/statusTone'

export const TENANT_STATUSES = ['active', 'suspended'] as const
export type TenantStatus = (typeof TENANT_STATUSES)[number]

export const TENANT_STATUS_LABELS: Record<TenantStatus, string> = {
    active: 'Activa',
    suspended: 'Suspendida',
}

export const TENANT_STATUS_TONES: Record<TenantStatus, StatusTone> = {
    active: 'success',
    suspended: 'danger',
}

export type PlatformSubscriptionStatus =
    | 'trial'
    | 'active'
    | 'suspended'
    | 'cancelled'

export const PLATFORM_SUBSCRIPTION_STATUS_LABELS: Record<
    PlatformSubscriptionStatus,
    string
> = {
    trial: 'En prueba',
    active: 'Activa',
    suspended: 'Suspendida',
    cancelled: 'Cancelada',
}

export interface PlatformLoginResult {
    accessToken: string
    expiresIn: number
    tokenType: string
    username: string
    displayName: string
}

export interface TenantSummary {
    id: string
    ruc: string
    legalName: string
    tradeName: string | null
    status: TenantStatus
    createdAt: string | null
    subscriptionStatus: PlatformSubscriptionStatus | null
    trialEndsAt: string | null
    plan: { code: string; name: string } | null
    activeUsers: number
    activeBranches: number
}

export interface TenantInvoicing {
    pendingInvoices: number
    rejectedInvoices: number
    authorizedInvoices: number
    uninvoicedSales: number
    openDiscrepancies: number
    documentsThisMonth: number
}

export interface TenantUsage {
    resource: string
    used: number
    limit: number | null
}

export interface TenantDetail extends TenantSummary {
    invoicing: TenantInvoicing
    subscription: {
        plan: { code: string; name: string } | null
        status: PlatformSubscriptionStatus
        readOnly: boolean
        resources: TenantUsage[]
    } | null
}

export interface TenantList {
    items: TenantSummary[]
    total: number
    limit: number
    offset: number
}

export interface PlatformPlan {
    code: string
    name: string
}

export interface CreateTenantInput {
    ruc: string
    legalName: string
    tradeName?: string
    adminUsername: string
    adminEmail: string
    adminFullName?: string
    branchAddress?: string
    planCode?: string
    trialDays?: number
}

export interface CreatedTenant {
    tenantId: string
    tenantCreated: boolean
    userCreated: boolean
    adminPassword: string | null
}

export interface ChangeSubscriptionInput {
    planCode?: string
    status?: PlatformSubscriptionStatus
    trialDays?: number
}

/** Textos de los errores de la consola, que el core dice en inglés */
export const PLATFORM_ERROR_MESSAGES: Record<string, string> = {
    INVALID_CREDENTIALS: 'Usuario o contraseña incorrectos.',
    LOGIN_LOCKED:
        'Demasiados intentos fallidos. Espera unos minutos e intenta de nuevo.',
    PLATFORM_CONSOLE_DISABLED: 'La consola de plataforma está desactivada.',
    PERMISSION_DENIED:
        'Tu acceso a la consola ya no está vigente: ingresa de nuevo.',
    TENANT_RUC_ALREADY_EXISTS: 'Ya existe una empresa con ese RUC.',
    TENANT_ALREADY_SUSPENDED: 'La empresa ya está suspendida.',
    TENANT_NOT_SUSPENDED: 'La empresa no está suspendida.',
    USERNAME_ALREADY_EXISTS: 'Ese usuario ya existe.',
    EMAIL_ALREADY_EXISTS: 'Ese correo ya está registrado.',
}
