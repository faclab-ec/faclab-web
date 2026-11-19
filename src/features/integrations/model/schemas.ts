import { z } from 'zod'
import { SCOPES, WEBHOOK_EVENT_TYPES } from './types'
import type {
    IntegrationClientInput,
    WebhookEndpointInput,
} from '../api/client'

// Los mismos límites del core (S6.2, S6.4)
export const MAX_ALLOWED_NETWORKS = 20
export const MAX_CLIENT_NAME = 64
export const MAX_WEBHOOK_URL = 2048
export const MAX_WEBHOOK_DESCRIPTION = 255

// Una IP o una red CIDR, IPv4 o IPv6. El core la normaliza y valida del todo
const NETWORK = /^[0-9a-fA-F:.]{2,39}(\/\d{1,3})?$/

/** Una red por línea, sin vacías ni repetidas */
export const networkLines = (text: string): string[] => [
    ...new Set(
        text
            .split(/[\n,]/)
            .map((line) => line.trim())
            .filter(Boolean)
    ),
]

export const integrationClientSchema = z
    .object({
        name: z
            .string()
            .trim()
            .min(1, 'Nombre requerido')
            .max(MAX_CLIENT_NAME, `Máximo ${MAX_CLIENT_NAME} caracteres`),
        scopes: z.array(z.enum(SCOPES)).min(1, 'Elige al menos un permiso'),
        allBranches: z.boolean(),
        branchIds: z.array(z.number().int().positive()),
        allowedIps: z.string(),
    })
    .superRefine((values, ctx) => {
        if (!values.allBranches && values.branchIds.length === 0) {
            ctx.addIssue({
                code: 'custom',
                path: ['branchIds'],
                message: 'Elige al menos una sucursal',
            })
        }
        const networks = networkLines(values.allowedIps)
        if (networks.length > MAX_ALLOWED_NETWORKS) {
            ctx.addIssue({
                code: 'custom',
                path: ['allowedIps'],
                message: `Máximo ${MAX_ALLOWED_NETWORKS} redes`,
            })
        }
        const invalid = networks.find((network) => !NETWORK.test(network))
        if (invalid) {
            ctx.addIssue({
                code: 'custom',
                path: ['allowedIps'],
                message: `No es una IP ni una red CIDR: ${invalid}`,
            })
        }
    })

export type IntegrationClientFormValues = z.infer<
    typeof integrationClientSchema
>

export const toIntegrationClientInput = (
    values: IntegrationClientFormValues
): IntegrationClientInput => {
    const networks = networkLines(values.allowedIps)
    return {
        name: values.name.trim(),
        scopes: [...values.scopes].sort(),
        branchIds: values.allBranches
            ? null
            : [...values.branchIds].sort((a, b) => a - b),
        allowedIps: networks.length ? networks : null,
    }
}

const webhookFields = {
    url: z
        .url({ protocol: /^https?$/, error: 'Una URL completa: https://…' })
        .max(MAX_WEBHOOK_URL, `Máximo ${MAX_WEBHOOK_URL} caracteres`),
    eventTypes: z
        .array(z.enum(WEBHOOK_EVENT_TYPES))
        .min(1, 'Elige al menos un evento'),
    description: z
        .string()
        .trim()
        .max(
            MAX_WEBHOOK_DESCRIPTION,
            `Máximo ${MAX_WEBHOOK_DESCRIPTION} caracteres`
        ),
    excludeOwnChanges: z.boolean(),
}

/** Al crear se elige el dueño; después ya no cambia */
export const webhookEndpointCreateSchema = z.object({
    ...webhookFields,
    integrationClientId: z.number().int().positive().nullable(),
})

export type WebhookEndpointCreateFormValues = z.infer<
    typeof webhookEndpointCreateSchema
>

export const webhookEndpointUpdateSchema = z.object(webhookFields)

export type WebhookEndpointUpdateFormValues = z.infer<
    typeof webhookEndpointUpdateSchema
>

export const toWebhookEndpointInput = (
    values: WebhookEndpointCreateFormValues
): WebhookEndpointInput => ({
    url: values.url.trim(),
    eventTypes: [...values.eventTypes].sort(),
    description: values.description.trim() || null,
    // Solo un endpoint con dueño puede excluir lo que causó ese cliente
    excludeOwnChanges:
        values.integrationClientId !== null && values.excludeOwnChanges,
    integrationClientId: values.integrationClientId,
})
