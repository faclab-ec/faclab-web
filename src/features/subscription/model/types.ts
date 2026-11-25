import type { SessionSubscription } from '@/@types/auth'
import type { StatusTone } from '@shared/lib/statusTone'

/** Estado de la suscripción de la empresa (S8.4) */
export const SUBSCRIPTION_STATUSES = [
    'trial',
    'active',
    'suspended',
    'cancelled',
] as const
export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number]

export const SUBSCRIPTION_STATUS_LABELS: Record<SubscriptionStatus, string> = {
    trial: 'En prueba',
    active: 'Activa',
    suspended: 'Suspendida',
    cancelled: 'Cancelada',
}

export const SUBSCRIPTION_STATUS_TONES: Record<SubscriptionStatus, StatusTone> =
    {
        trial: 'info',
        active: 'success',
        suspended: 'danger',
        cancelled: 'neutral',
    }

/** Lo que limita un plan, en el orden de la pantalla */
export const PLAN_RESOURCES = [
    'branches',
    'terminals',
    'users',
    'integration_clients',
    'webhook_endpoints',
] as const
export type PlanResource = (typeof PLAN_RESOURCES)[number]

export const PLAN_RESOURCE_LABELS: Record<PlanResource, string> = {
    branches: 'Sucursales activas',
    terminals: 'Cajas activas',
    users: 'Usuarios activos',
    integration_clients: 'Clientes de integración',
    webhook_endpoints: 'Endpoints de webhooks',
}

export type Plan = {
    code: string
    name: string
    publicApi: boolean
    maxBranches: number | null
    maxTerminals: number | null
    maxUsers: number | null
    maxIntegrationClients: number | null
    maxWebhookEndpoints: number | null
    maxMonthlyDocuments: number | null
}

export type ResourceUsage = {
    resource: PlanResource
    used: number
    /** null: sin límite */
    limit: number | null
}

export type MonthlyDocuments = {
    /** Primer día del mes (hora de Ecuador), `2026-11-01` */
    period: string
    invoices: number
    creditNotes: number
    total: number
}

export type Subscription = {
    /** null: no hay plan configurado (sin límites) */
    plan: Plan | null
    status: SubscriptionStatus
    trialEndsAt: string | null
    readOnly: boolean
    resources: ResourceUsage[]
    documents: {
        limit: number | null
        /** Los últimos seis meses, el actual al final */
        months: MonthlyDocuments[]
    }
}

/** Lo que `/api/auth/me` dice de la suscripción, para todos los roles */
export type SubscriptionSummary = SessionSubscription

/** Qué parte del límite se usa, de 0 a 100; sin límite, 0 */
export function usagePercent(used: number, limit: number | null): number {
    if (limit === null) return 0
    if (limit === 0) return used > 0 ? 100 : 0
    return Math.min(100, Math.round((used / limit) * 100))
}

/** Tono de un uso: lleno o por encima (al bajar de plan), en peligro */
export function usageTone(used: number, limit: number | null): StatusTone {
    if (limit === null) return 'neutral'
    if (used >= limit) return 'danger'
    if (used >= limit * 0.8) return 'warning'
    return 'success'
}

export function limitLabel(limit: number | null): string {
    return limit === null ? 'Sin límite' : limit.toLocaleString('es-EC')
}

/** `2026-11-01` → `noviembre de 2026` */
export function periodLabel(period: string): string {
    const [year, month] = period.split('-').map(Number)
    return new Date(year, month - 1, 1).toLocaleDateString('es-EC', {
        month: 'long',
        year: 'numeric',
    })
}

/** Días que faltan para que termine la prueba (redondeados hacia arriba) */
export function daysLeft(trialEndsAt: string, now: Date): number {
    const ms = new Date(trialEndsAt).getTime() - now.getTime()
    return Math.ceil(ms / 86_400_000)
}

export type SubscriptionNotice = {
    type: 'danger' | 'warning' | 'info'
    title: string
    message: string
}

/** Lo que el aviso de la app dice de la suscripción; null si nada */
export function subscriptionNotice(
    subscription: SubscriptionSummary | undefined,
    now: Date = new Date()
): SubscriptionNotice | null {
    if (!subscription) return null
    if (subscription.readOnly) {
        const reason =
            subscription.status === 'trial'
                ? 'El período de prueba terminó'
                : `La suscripción está ${SUBSCRIPTION_STATUS_LABELS[
                      subscription.status
                  ].toLowerCase()}`
        return {
            type: 'danger',
            title: `${reason}: la empresa solo puede consultar`,
            message:
                'No se pueden registrar ventas ni cambiar datos. Las facturas de las ventas ya hechas se siguen emitiendo. Comunícate con Faclab para reactivarla.',
        }
    }
    if (subscription.status === 'trial' && subscription.trialEndsAt) {
        const days = daysLeft(subscription.trialEndsAt, now)
        if (days <= 7) {
            return {
                type: 'info',
                title:
                    days <= 1
                        ? 'El período de prueba termina hoy'
                        : `El período de prueba termina en ${days} días`,
                message:
                    'Después la empresa solo podrá consultar hasta que se active la suscripción.',
            }
        }
    }
    if (subscription.documentsLimitReached) {
        return {
            type: 'warning',
            title: 'Se alcanzó el límite de comprobantes del mes',
            message:
                'Las facturas se siguen emitiendo; revisa el plan en Configuración → Plan y uso.',
        }
    }
    return null
}
