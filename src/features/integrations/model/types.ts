import type { StatusTone } from '@shared/lib/statusTone'

// --- Clientes de integración (S6.2) ---

/** Lo que un cliente puede hacer en la API pública (`Scope` de faclab-core) */
export const SCOPES = [
    'products:read',
    'products:write',
    'prices:read',
    'prices:write',
    'stock:read',
    'inventory:write',
    'customers:read',
    'customers:write',
    'sales:read',
    'sales:write',
    'invoices:read',
    'webhooks:manage',
] as const

export type Scope = (typeof SCOPES)[number]

export const SCOPE_LABELS: Record<Scope, string> = {
    'products:read': 'Leer productos, categorías, unidades y presentaciones',
    'products:write': 'Crear y actualizar productos',
    'prices:read': 'Leer listas de precios',
    'prices:write': 'Cambiar listas de precios',
    'stock:read': 'Leer el stock por sucursal y bodega',
    'inventory:write': 'Documentos de inventario (ajustes, transferencias)',
    'customers:read': 'Leer clientes',
    'customers:write': 'Crear y actualizar clientes',
    'sales:read': 'Leer ventas',
    'sales:write': 'Crear y anular sus ventas',
    'invoices:read': 'Leer facturas y notas de crédito, su XML y RIDE',
    'webhooks:manage': 'Registrar sus propios webhooks',
}

export const INTEGRATION_CLIENT_STATUSES = ['ACTIVE', 'REVOKED'] as const
export type IntegrationClientStatus =
    (typeof INTEGRATION_CLIENT_STATUSES)[number]

export const INTEGRATION_CLIENT_STATUS_LABELS: Record<
    IntegrationClientStatus,
    string
> = {
    ACTIVE: 'Activo',
    REVOKED: 'Revocado',
}

export const INTEGRATION_CLIENT_STATUS_TONES: Record<
    IntegrationClientStatus,
    StatusTone
> = {
    ACTIVE: 'success',
    REVOKED: 'danger',
}

/** Lo fija el despliegue: `fl_test_` en el sandbox, `fl_live_` en producción */
export const INTEGRATION_ENVIRONMENTS = ['sandbox', 'production'] as const
export type IntegrationEnvironment = (typeof INTEGRATION_ENVIRONMENTS)[number]

export const INTEGRATION_ENVIRONMENT_LABELS: Record<
    IntegrationEnvironment,
    string
> = {
    sandbox: 'Sandbox',
    production: 'Producción',
}

export const INTEGRATION_ENVIRONMENT_TONES: Record<
    IntegrationEnvironment,
    StatusTone
> = {
    sandbox: 'warning',
    production: 'info',
}

/** Un secreto del cliente: el core solo guarda su hash y su prefijo */
export interface ClientSecret {
    id: number
    prefix: string
    /** Ni revocado ni vencido */
    isActive: boolean
    createdAt: string
    expiresAt: string | null
    revokedAt: string | null
    lastUsedAt: string | null
}

export interface IntegrationClient {
    id: number
    /** `fl_test_…` / `fl_live_…`: lo que el integrador usa como usuario */
    clientId: string
    name: string
    environment: IntegrationEnvironment
    status: IntegrationClientStatus
    scopes: Scope[]
    /** null: todas las sucursales */
    branchIds: number[] | null
    /** Redes CIDR de origen; null: cualquiera */
    allowedIps: string[] | null
    createdAt: string
    updatedAt: string
    revokedAt: string | null
    lastUsedAt: string | null
    /** Todos, también los revocados y vencidos, por id */
    secrets: ClientSecret[]
}

/** La respuesta de crear: el secreto se muestra esta única vez */
export interface CreatedIntegrationClient extends IntegrationClient {
    clientSecret: string
}

export interface CreatedClientSecret extends ClientSecret {
    clientSecret: string
}

/** Un día con actividad; el core no envía los días sin ella */
export interface IntegrationUsageDay {
    /** YYYY-MM-DD */
    day: string
    tokenRequests: number
    tokenFailures: number
    requests: number
    errors: number
    lastIp: string | null
    lastSeenAt: string | null
}

export interface IntegrationClientListParams {
    status?: IntegrationClientStatus
    limit?: number
    offset?: number
}

export interface IntegrationUsageParams {
    fromDate?: string
    toDate?: string
}

// --- Webhooks (S6.4) ---

export const WEBHOOK_EVENT_TYPES = [
    'sale.confirmed',
    'sale.cancelled',
    'invoice.authorized',
    'invoice.rejected',
    'credit_note.authorized',
    'stock.changed',
    'product.updated',
] as const

export type WebhookEventType = (typeof WEBHOOK_EVENT_TYPES)[number]

export const WEBHOOK_EVENT_LABELS: Record<WebhookEventType, string> = {
    'sale.confirmed': 'Venta confirmada',
    'sale.cancelled': 'Venta anulada',
    'invoice.authorized': 'Factura autorizada',
    'invoice.rejected': 'Factura rechazada',
    'credit_note.authorized': 'Nota de crédito autorizada',
    'stock.changed': 'Cambio de stock',
    'product.updated': 'Producto creado o modificado',
}

/** Lo que el cliente dueño necesita para recibir cada evento (como el core) */
export const WEBHOOK_EVENT_SCOPES: Record<WebhookEventType, Scope> = {
    'sale.confirmed': 'sales:read',
    'sale.cancelled': 'sales:read',
    'invoice.authorized': 'invoices:read',
    'invoice.rejected': 'invoices:read',
    'credit_note.authorized': 'invoices:read',
    'stock.changed': 'stock:read',
    'product.updated': 'products:read',
}

/** Además de los suscribibles, el que se envía con "Probar" */
export const TEST_EVENT = 'webhook.test'

export const eventLabel = (type: string): string =>
    type === TEST_EVENT
        ? 'Prueba'
        : WEBHOOK_EVENT_LABELS[type as WebhookEventType] ?? type

export const WEBHOOK_ENDPOINT_STATUSES = ['active', 'disabled'] as const
export type WebhookEndpointStatus = (typeof WEBHOOK_ENDPOINT_STATUSES)[number]

export const WEBHOOK_ENDPOINT_STATUS_LABELS: Record<
    WebhookEndpointStatus,
    string
> = {
    active: 'Activo',
    disabled: 'Desactivado',
}

export const WEBHOOK_ENDPOINT_STATUS_TONES: Record<
    WebhookEndpointStatus,
    StatusTone
> = {
    active: 'success',
    disabled: 'neutral',
}

export const WEBHOOK_DISABLED_REASONS = [
    'manual',
    'failing',
    'client_revoked',
] as const
export type WebhookDisabledReason = (typeof WEBHOOK_DISABLED_REASONS)[number]

export const WEBHOOK_DISABLED_REASON_LABELS: Record<
    WebhookDisabledReason,
    string
> = {
    manual: 'A mano',
    failing: 'Por fallas',
    client_revoked: 'Cliente revocado',
}

export const WEBHOOK_DELIVERY_STATUSES = [
    'pending',
    'delivered',
    'failed',
] as const
export type WebhookDeliveryStatus = (typeof WEBHOOK_DELIVERY_STATUSES)[number]

export const WEBHOOK_DELIVERY_STATUS_LABELS: Record<
    WebhookDeliveryStatus,
    string
> = {
    pending: 'Pendiente',
    delivered: 'Entregada',
    failed: 'Fallida',
}

export const WEBHOOK_DELIVERY_STATUS_TONES: Record<
    WebhookDeliveryStatus,
    StatusTone
> = {
    pending: 'info',
    delivered: 'success',
    failed: 'danger',
}

export interface WebhookEndpoint {
    id: number
    url: string
    description: string | null
    eventTypes: WebhookEventType[]
    status: WebhookEndpointStatus
    disabledReason: WebhookDisabledReason | null
    disabledAt: string | null
    /** null: de la empresa (lo creó un administrador) */
    integrationClientId: number | null
    excludeOwnChanges: boolean
    /** Los primeros caracteres del secreto (`whsec_XXXX`) */
    secretHint: string
    /** Mientras el anterior siga valiendo después de rotar */
    previousSecretExpiresAt: string | null
    lastSuccessAt: string | null
    failingSince: string | null
    createdAt: string
    updatedAt: string
}

/** El secreto se guarda cifrado: se puede leer cuando haga falta */
export interface WebhookSecret {
    secret: string
    previousSecret: string | null
    previousExpiresAt: string | null
}

export interface WebhookDelivery {
    id: number
    endpointId: number
    /** El `webhook-id` que recibe el endpoint (`msg_…`) */
    messageId: string
    eventType: string
    occurredAt: string
    status: WebhookDeliveryStatus
    attempts: number
    nextAttemptAt: string | null
    lastAttemptAt: string | null
    responseStatus: number | null
    lastError: string | null
    durationMs: number | null
    deliveredAt: string | null
    retriedAt: string | null
    createdAt: string
}

export interface WebhookEndpointListParams {
    status?: WebhookEndpointStatus
    limit?: number
    offset?: number
}

export interface WebhookDeliveryListParams {
    status?: WebhookDeliveryStatus
    eventType?: string
    limit?: number
    offset?: number
}
