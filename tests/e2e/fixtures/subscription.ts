import type { SessionSubscription } from '@/@types/auth'
import type { Subscription } from '@features/subscription/model/types'

/** La suscripción de `/me` de una empresa activa sin nada que avisar */
export const activeSubscription = (
    overrides: Partial<SessionSubscription> = {}
): SessionSubscription => ({
    planName: 'Profesional',
    status: 'active',
    trialEndsAt: null,
    readOnly: false,
    documentsLimitReached: false,
    ...overrides,
})

/** `GET /api/admin/subscription` de una empresa con el plan básico */
export const buildSubscription = (
    overrides: Partial<Subscription> = {}
): Subscription => ({
    plan: {
        code: 'basico',
        name: 'Básico',
        publicApi: false,
        maxBranches: 1,
        maxTerminals: 2,
        maxUsers: 3,
        maxIntegrationClients: 0,
        maxWebhookEndpoints: 0,
        maxMonthlyDocuments: 300,
    },
    status: 'active',
    trialEndsAt: null,
    readOnly: false,
    resources: [
        { resource: 'branches', used: 1, limit: 1 },
        { resource: 'terminals', used: 1, limit: 2 },
        { resource: 'users', used: 2, limit: 3 },
        { resource: 'integration_clients', used: 0, limit: 0 },
        { resource: 'webhook_endpoints', used: 0, limit: 0 },
    ],
    documents: {
        limit: 300,
        months: [
            { period: '2026-06-01', invoices: 0, creditNotes: 0, total: 0 },
            { period: '2026-07-01', invoices: 0, creditNotes: 0, total: 0 },
            { period: '2026-08-01', invoices: 0, creditNotes: 0, total: 0 },
            { period: '2026-09-01', invoices: 120, creditNotes: 3, total: 123 },
            { period: '2026-10-01', invoices: 180, creditNotes: 5, total: 185 },
            { period: '2026-11-01', invoices: 96, creditNotes: 2, total: 98 },
        ],
    },
    ...overrides,
})
