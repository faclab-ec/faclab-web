import type {
    ClientSecret,
    IntegrationClient,
    IntegrationUsageDay,
    WebhookDelivery,
    WebhookEndpoint,
} from '@/features/integrations/model/types'
import {
    ADMIN,
    apiError,
    ok,
    paginated,
    type MockApi,
} from '../support/mockApi'

const NOW = '2026-01-15T15:00:00.000Z'

export const buildSecret = (
    overrides: Partial<ClientSecret> = {}
): ClientSecret => ({
    id: 1,
    prefix: 'Ab3dE9',
    isActive: true,
    createdAt: '2026-01-10T15:00:00.000Z',
    expiresAt: null,
    revokedAt: null,
    lastUsedAt: '2026-01-15T14:00:00.000Z',
    ...overrides,
})

export const buildClient = (
    overrides: Partial<IntegrationClient> = {}
): IntegrationClient => ({
    id: 1,
    clientId: 'fl_test_3f2a9c1b0d4e',
    name: 'Tienda en línea',
    environment: 'sandbox',
    status: 'ACTIVE',
    scopes: ['products:read', 'sales:read', 'sales:write', 'stock:read'],
    branchIds: null,
    allowedIps: null,
    createdAt: '2026-01-10T15:00:00.000Z',
    updatedAt: '2026-01-10T15:00:00.000Z',
    revokedAt: null,
    lastUsedAt: '2026-01-15T14:00:00.000Z',
    secrets: [buildSecret()],
    ...overrides,
})

export const buildEndpoint = (
    overrides: Partial<WebhookEndpoint> = {}
): WebhookEndpoint => ({
    id: 1,
    url: 'https://tienda.example/webhooks/faclab',
    description: 'Pedidos de la tienda',
    eventTypes: ['sale.confirmed'],
    status: 'active',
    disabledReason: null,
    disabledAt: null,
    integrationClientId: 1,
    excludeOwnChanges: true,
    secretHint: 'whsec_K5oZ',
    previousSecretExpiresAt: null,
    lastSuccessAt: '2026-01-15T14:30:00.000Z',
    failingSince: null,
    createdAt: '2026-01-10T15:00:00.000Z',
    updatedAt: '2026-01-10T15:00:00.000Z',
    ...overrides,
})

export const buildDelivery = (
    overrides: Partial<WebhookDelivery> = {}
): WebhookDelivery => ({
    id: 1,
    endpointId: 1,
    messageId: 'msg_2f9a01',
    eventType: 'sale.confirmed',
    occurredAt: '2026-01-15T14:00:00.000Z',
    status: 'delivered',
    attempts: 1,
    nextAttemptAt: null,
    lastAttemptAt: '2026-01-15T14:00:01.000Z',
    responseStatus: 200,
    lastError: null,
    durationMs: 84,
    deliveredAt: '2026-01-15T14:00:01.000Z',
    retriedAt: null,
    createdAt: '2026-01-15T14:00:00.000Z',
    ...overrides,
})

/** Hoy en el reloj del navegador: el portal muestra los últimos 30 días */
const today = () => {
    const now = new Date()
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(
        now.getDate()
    )}`
}

export const buildUsageDay = (
    overrides: Partial<IntegrationUsageDay> = {}
): IntegrationUsageDay => ({
    day: today(),
    tokenRequests: 4,
    tokenFailures: 1,
    requests: 120,
    errors: 3,
    lastIp: '203.0.113.7',
    lastSeenAt: '2026-01-15T14:00:00.000Z',
    ...overrides,
})

const notFound = () => apiError(404, 'NOT_FOUND', 'Not found')

const nextId = (rows: { id: number }[]) =>
    Math.max(0, ...rows.map((r) => r.id)) + 1

const byStatus = <T extends { status: string }>(
    rows: T[],
    query: URLSearchParams
) => {
    const status = query.get('status')
    return status ? rows.filter((r) => r.status === status) : rows
}

/**
 * Clientes de integración, sus secretos y su uso, y los webhooks con sus
 * entregas, con estado en memoria y las reglas del core que la pantalla
 * muestra: el secreto solo en la respuesta de crear, dos secretos activos como
 * mucho, revocar un cliente desactiva sus webhooks.
 */
export const mockIntegrations = (
    api: MockApi,
    seed: {
        clients?: IntegrationClient[]
        endpoints?: WebhookEndpoint[]
        deliveries?: WebhookDelivery[]
        usage?: IntegrationUsageDay[]
    } = {}
) => {
    const clients = [...(seed.clients ?? [buildClient()])]
    const endpoints = [...(seed.endpoints ?? [buildEndpoint()])]
    const deliveries = [...(seed.deliveries ?? [buildDelivery()])]
    const usage = [...(seed.usage ?? [buildUsageDay()])]
    let secrets = 0
    const newSecret = () => `secreto-${++secrets}-de-prueba`
    const webhookSecrets = new Map<number, string>()
    const secretOf = (id: number) =>
        webhookSecrets.get(id) ?? `whsec_K5oZsecreto${id}`

    const client = (id: string) => clients.find((c) => c.id === Number(id))
    const endpoint = (id: string) => endpoints.find((e) => e.id === Number(id))

    // --- Clientes ---

    api.get(`${ADMIN}/integrations`, ({ query }) =>
        paginated(byStatus(clients, query), query)
    )
    api.get(`${ADMIN}/integrations/:id`, ({ params }) => {
        const found = client(params.id)
        return found ? ok(found) : notFound()
    })
    api.post(`${ADMIN}/integrations`, ({ body }) => {
        const id = nextId(clients)
        const created: IntegrationClient = {
            ...buildClient(),
            ...(body as Partial<IntegrationClient>),
            id,
            clientId: `fl_test_${String(id).padStart(12, '0')}`,
            lastUsedAt: null,
            createdAt: NOW,
            updatedAt: NOW,
            secrets: [buildSecret({ id: 100 + id, lastUsedAt: null })],
        }
        clients.push(created)
        return ok({ ...created, clientSecret: newSecret() })
    })
    api.put(`${ADMIN}/integrations/:id`, ({ params, body }) => {
        const found = client(params.id)
        if (!found) return notFound()
        Object.assign(found, body, { updatedAt: NOW })
        return ok(found)
    })
    api.post(`${ADMIN}/integrations/:id/revoke`, ({ params }) => {
        const found = client(params.id)
        if (!found) return notFound()
        found.status = 'REVOKED'
        found.revokedAt = NOW
        for (const secret of found.secrets) {
            secret.isActive = false
            secret.revokedAt ??= NOW
        }
        for (const e of endpoints.filter(
            (e) => e.integrationClientId === found.id
        )) {
            e.status = 'disabled'
            e.disabledReason = 'client_revoked'
        }
        return ok(found)
    })
    api.post(`${ADMIN}/integrations/:id/secrets`, ({ params, body }) => {
        const found = client(params.id)
        if (!found) return notFound()
        const days = (body as { previousExpiresInDays: number | null })
            .previousExpiresInDays
        const active = found.secrets.filter((s) => s.isActive)
        if (days === null && active.length >= 2) {
            return apiError(
                409,
                'INTEGRATION_SECRET_LIMIT_REACHED',
                'At most two active secrets'
            )
        }
        for (const secret of active) {
            if (days === 0) secret.isActive = false
            secret.expiresAt = days === null ? secret.expiresAt : NOW
        }
        const secret = buildSecret({
            id: nextId(found.secrets),
            prefix: `Nw${found.secrets.length}xY7`,
            createdAt: NOW,
            lastUsedAt: null,
        })
        found.secrets.push(secret)
        return ok({ ...secret, clientSecret: newSecret() })
    })
    api.post(
        `${ADMIN}/integrations/:id/secrets/:secretId/revoke`,
        ({ params }) => {
            const secret = client(params.id)?.secrets.find(
                (s) => s.id === Number(params.secretId)
            )
            if (!secret) return notFound()
            secret.isActive = false
            secret.revokedAt = NOW
            return ok(secret)
        }
    )
    api.get(`${ADMIN}/integrations/:id/usage`, () => ok(usage))

    // --- Webhooks ---

    api.get(`${ADMIN}/webhook-endpoints`, ({ query }) =>
        paginated(byStatus(endpoints, query), query)
    )
    api.get(`${ADMIN}/webhook-endpoints/:id`, ({ params }) => {
        const found = endpoint(params.id)
        return found ? ok(found) : notFound()
    })
    api.post(`${ADMIN}/webhook-endpoints`, ({ body }) => {
        const created: WebhookEndpoint = {
            ...buildEndpoint(),
            ...(body as Partial<WebhookEndpoint>),
            id: nextId(endpoints),
            lastSuccessAt: null,
            createdAt: NOW,
            updatedAt: NOW,
        }
        endpoints.push(created)
        return ok(created)
    })
    api.put(`${ADMIN}/webhook-endpoints/:id`, ({ params, body }) => {
        const found = endpoint(params.id)
        if (!found) return notFound()
        Object.assign(found, body, { updatedAt: NOW })
        return ok(found)
    })
    api.delete(`${ADMIN}/webhook-endpoints/:id`, ({ params }) => {
        const index = endpoints.findIndex((e) => e.id === Number(params.id))
        if (index < 0) return notFound()
        endpoints.splice(index, 1)
        // Como el core: 200 con null, sin envoltura
        return { status: 200, body: null }
    })
    api.post(`${ADMIN}/webhook-endpoints/:id/disable`, ({ params }) => {
        const found = endpoint(params.id)
        if (!found) return notFound()
        found.status = 'disabled'
        found.disabledReason = 'manual'
        found.disabledAt = NOW
        return ok(found)
    })
    api.post(`${ADMIN}/webhook-endpoints/:id/enable`, ({ params }) => {
        const found = endpoint(params.id)
        if (!found) return notFound()
        found.status = 'active'
        found.disabledReason = null
        found.disabledAt = null
        found.failingSince = null
        return ok(found)
    })
    api.get(`${ADMIN}/webhook-endpoints/:id/secret`, ({ params }) => {
        const found = endpoint(params.id)
        if (!found) return notFound()
        return ok({
            secret: secretOf(found.id),
            previousSecret: found.previousSecretExpiresAt
                ? `whsec_anterior${found.id}`
                : null,
            previousExpiresAt: found.previousSecretExpiresAt,
        })
    })
    api.post(
        `${ADMIN}/webhook-endpoints/:id/rotate-secret`,
        ({ params, body }) => {
            const found = endpoint(params.id)
            if (!found) return notFound()
            const hours = (body as { previousExpiresInHours: number })
                .previousExpiresInHours
            webhookSecrets.set(found.id, `whsec_Rotado${found.id}nuevo`)
            found.secretHint = 'whsec_Rota'
            found.previousSecretExpiresAt = hours
                ? '2026-01-16T15:00:00.000Z'
                : null
            return ok(found)
        }
    )
    api.post(`${ADMIN}/webhook-endpoints/:id/test`, ({ params }) => {
        const found = endpoint(params.id)
        if (!found) return notFound()
        if (found.status === 'disabled') {
            return apiError(
                409,
                'WEBHOOK_ENDPOINT_DISABLED',
                'The endpoint is disabled'
            )
        }
        const delivery = buildDelivery({
            id: nextId(deliveries),
            endpointId: found.id,
            messageId: `msg_test${nextId(deliveries)}`,
            eventType: 'webhook.test',
            occurredAt: NOW,
            status: 'pending',
            attempts: 0,
            nextAttemptAt: NOW,
            lastAttemptAt: null,
            responseStatus: null,
            durationMs: null,
            deliveredAt: null,
            createdAt: NOW,
        })
        deliveries.unshift(delivery)
        return ok(delivery)
    })
    api.get(
        `${ADMIN}/webhook-endpoints/:id/deliveries`,
        ({ params, query }) => {
            const eventType = query.get('eventType')
            const rows = byStatus(
                deliveries.filter((d) => d.endpointId === Number(params.id)),
                query
            ).filter((d) => !eventType || d.eventType === eventType)
            return paginated(rows, query)
        }
    )
    api.post(
        `${ADMIN}/webhook-endpoints/:id/deliveries/:deliveryId/retry`,
        ({ params }) => {
            const delivery = deliveries.find(
                (d) => d.id === Number(params.deliveryId)
            )
            if (!delivery) return notFound()
            Object.assign(delivery, {
                status: 'pending',
                attempts: 0,
                nextAttemptAt: NOW,
                retriedAt: NOW,
            })
            return ok(delivery)
        }
    )

    return { clients, endpoints, deliveries }
}
