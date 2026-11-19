import { httpClient } from '@shared/lib/http/httpClient'
import appConfig from '@/configs/app.config'
import type { DataResponse, PaginatedResponse } from '@/@types/api'
import type {
    ClientSecret,
    CreatedClientSecret,
    CreatedIntegrationClient,
    IntegrationClient,
    IntegrationClientListParams,
    IntegrationUsageDay,
    IntegrationUsageParams,
    Scope,
    WebhookDelivery,
    WebhookDeliveryListParams,
    WebhookEndpoint,
    WebhookEndpointListParams,
    WebhookEventType,
    WebhookSecret,
} from '../model/types'

const HOST = appConfig.inventoryApiHost

// Todo esto es `integration:manage` (solo ADMIN). Las creaciones responden 200.

export type IntegrationClientInput = {
    name: string
    scopes: Scope[]
    /** null: todas las sucursales */
    branchIds: number[] | null
    /** null: cualquier origen */
    allowedIps: string[] | null
}

export type NewClientSecretInput = {
    /** Días que siguen valiendo los secretos activos; null: no se tocan */
    previousExpiresInDays: number | null
}

export type WebhookEndpointUpdateInput = {
    url: string
    eventTypes: WebhookEventType[]
    description: string | null
    excludeOwnChanges: boolean
}

export type WebhookEndpointInput = WebhookEndpointUpdateInput & {
    /** El cliente dueño; null: de la empresa. No cambia después */
    integrationClientId: number | null
}

export type RotateWebhookSecretInput = {
    /** Horas que sigue valiendo el secreto anterior (0 a 72) */
    previousExpiresInHours: number
}

// --- Clientes de integración ---

export const getIntegrationClients = (params?: IntegrationClientListParams) =>
    httpClient.get<PaginatedResponse<IntegrationClient>>(
        `${HOST}/integrations`,
        { params }
    )

export const getIntegrationClient = (id: number) =>
    httpClient.get<DataResponse<IntegrationClient>>(
        `${HOST}/integrations/${id}`
    )

export const createIntegrationClient = (data: IntegrationClientInput) =>
    httpClient.post<DataResponse<CreatedIntegrationClient>>(
        `${HOST}/integrations`,
        data
    )

export const updateIntegrationClient = (
    id: number,
    data: IntegrationClientInput
) =>
    httpClient.put<DataResponse<IntegrationClient>>(
        `${HOST}/integrations/${id}`,
        data
    )

export const revokeIntegrationClient = (id: number) =>
    httpClient.post<DataResponse<IntegrationClient>>(
        `${HOST}/integrations/${id}/revoke`
    )

export const createClientSecret = (id: number, data: NewClientSecretInput) =>
    httpClient.post<DataResponse<CreatedClientSecret>>(
        `${HOST}/integrations/${id}/secrets`,
        data
    )

export const revokeClientSecret = (id: number, secretId: number) =>
    httpClient.post<DataResponse<ClientSecret>>(
        `${HOST}/integrations/${id}/secrets/${secretId}/revoke`
    )

export const getIntegrationUsage = (
    id: number,
    params?: IntegrationUsageParams
) =>
    httpClient.get<DataResponse<IntegrationUsageDay[]>>(
        `${HOST}/integrations/${id}/usage`,
        { params }
    )

// --- Webhooks ---

export const getWebhookEndpoints = (params?: WebhookEndpointListParams) =>
    httpClient.get<PaginatedResponse<WebhookEndpoint>>(
        `${HOST}/webhook-endpoints`,
        { params }
    )

export const getWebhookEndpoint = (id: number) =>
    httpClient.get<DataResponse<WebhookEndpoint>>(
        `${HOST}/webhook-endpoints/${id}`
    )

export const createWebhookEndpoint = (data: WebhookEndpointInput) =>
    httpClient.post<DataResponse<WebhookEndpoint>>(
        `${HOST}/webhook-endpoints`,
        data
    )

export const updateWebhookEndpoint = (
    id: number,
    data: WebhookEndpointUpdateInput
) =>
    httpClient.put<DataResponse<WebhookEndpoint>>(
        `${HOST}/webhook-endpoints/${id}`,
        data
    )

// Responde `null` sin envoltura
export const deleteWebhookEndpoint = (id: number) =>
    httpClient.delete(`${HOST}/webhook-endpoints/${id}`)

export const enableWebhookEndpoint = (id: number) =>
    httpClient.post<DataResponse<WebhookEndpoint>>(
        `${HOST}/webhook-endpoints/${id}/enable`
    )

export const disableWebhookEndpoint = (id: number) =>
    httpClient.post<DataResponse<WebhookEndpoint>>(
        `${HOST}/webhook-endpoints/${id}/disable`
    )

export const getWebhookSecret = (id: number) =>
    httpClient.get<DataResponse<WebhookSecret>>(
        `${HOST}/webhook-endpoints/${id}/secret`
    )

// No trae el secreto: se lee después con getWebhookSecret
export const rotateWebhookSecret = (
    id: number,
    data: RotateWebhookSecretInput
) =>
    httpClient.post<DataResponse<WebhookEndpoint>>(
        `${HOST}/webhook-endpoints/${id}/rotate-secret`,
        data
    )

export const testWebhookEndpoint = (id: number) =>
    httpClient.post<DataResponse<WebhookDelivery>>(
        `${HOST}/webhook-endpoints/${id}/test`
    )

export const getWebhookDeliveries = (
    id: number,
    params?: WebhookDeliveryListParams
) =>
    httpClient.get<PaginatedResponse<WebhookDelivery>>(
        `${HOST}/webhook-endpoints/${id}/deliveries`,
        { params }
    )

export const retryWebhookDelivery = (id: number, deliveryId: number) =>
    httpClient.post<DataResponse<WebhookDelivery>>(
        `${HOST}/webhook-endpoints/${id}/deliveries/${deliveryId}/retry`
    )
