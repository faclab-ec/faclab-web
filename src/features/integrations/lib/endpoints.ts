import type { IntegrationClient, WebhookEndpoint } from '../model/types'

/** La URL sin la consulta, que puede llevar un token del integrador */
export const displayUrl = (url: string) => url.split('?')[0]

/** De quién es el endpoint: la empresa o un cliente de integración */
export const ownerName = (
    endpoint: WebhookEndpoint,
    clients: IntegrationClient[]
) =>
    endpoint.integrationClientId === null
        ? 'Empresa'
        : clients.find((c) => c.id === endpoint.integrationClientId)?.name ??
          `Cliente #${endpoint.integrationClientId}`
