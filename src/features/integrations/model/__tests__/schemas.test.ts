import { describe, expect, it } from 'vitest'
import {
    integrationClientSchema,
    networkLines,
    toIntegrationClientInput,
    toWebhookEndpointInput,
    webhookEndpointCreateSchema,
    type IntegrationClientFormValues,
} from '../schemas'

const CLIENT: IntegrationClientFormValues = {
    name: 'Tienda en línea',
    scopes: ['sales:write', 'products:read'],
    allBranches: true,
    branchIds: [],
    allowedIps: '',
}

describe('integrationClientSchema', () => {
    it('requires a name and at least one scope', () => {
        const result = integrationClientSchema.safeParse({
            ...CLIENT,
            name: '  ',
            scopes: [],
        })
        expect(result.success).toBe(false)
        const paths = result.error?.issues.map((i) => i.path[0])
        expect(paths).toEqual(expect.arrayContaining(['name', 'scopes']))
    })

    it('rejects a scope the core does not have', () => {
        expect(
            integrationClientSchema.safeParse({
                ...CLIENT,
                scopes: ['payments:write'],
            }).success
        ).toBe(false)
    })

    it('needs a branch unless all of them are allowed', () => {
        const result = integrationClientSchema.safeParse({
            ...CLIENT,
            allBranches: false,
        })
        expect(result.error?.issues[0].path).toEqual(['branchIds'])
        expect(
            integrationClientSchema.safeParse({
                ...CLIENT,
                allBranches: false,
                branchIds: [2],
            }).success
        ).toBe(true)
    })

    it('names the line that is not an IP or a network', () => {
        const result = integrationClientSchema.safeParse({
            ...CLIENT,
            allowedIps: '203.0.113.7\nmi-servidor',
        })
        expect(result.error?.issues[0].message).toBe(
            'No es una IP ni una red CIDR: mi-servidor'
        )
    })

    it('takes IPv4, IPv6 and CIDR networks', () => {
        expect(
            integrationClientSchema.safeParse({
                ...CLIENT,
                allowedIps: '203.0.113.7\n198.51.100.0/24\n2001:db8::/32',
            }).success
        ).toBe(true)
    })

    it('takes at most 20 networks', () => {
        const allowedIps = Array.from(
            { length: 21 },
            (_, i) => `10.0.0.${i}`
        ).join('\n')
        expect(
            integrationClientSchema.safeParse({ ...CLIENT, allowedIps }).success
        ).toBe(false)
    })
})

describe('networkLines', () => {
    it('splits by lines or commas, without blanks or repeats', () => {
        expect(networkLines(' 10.0.0.1 \n\n10.0.0.1, 10.0.0.0/8 ')).toEqual([
            '10.0.0.1',
            '10.0.0.0/8',
        ])
    })
})

describe('toIntegrationClientInput', () => {
    it('sends null for every branch and any origin', () => {
        expect(toIntegrationClientInput(CLIENT)).toEqual({
            name: 'Tienda en línea',
            scopes: ['products:read', 'sales:write'],
            branchIds: null,
            allowedIps: null,
        })
    })

    it('sends the chosen branches and networks, sorted', () => {
        expect(
            toIntegrationClientInput({
                ...CLIENT,
                allBranches: false,
                branchIds: [3, 1],
                allowedIps: '203.0.113.7\n198.51.100.0/24',
            })
        ).toMatchObject({
            branchIds: [1, 3],
            allowedIps: ['203.0.113.7', '198.51.100.0/24'],
        })
    })
})

describe('webhookEndpointCreateSchema', () => {
    const ENDPOINT = {
        url: 'https://tienda.example/webhooks/faclab',
        description: '',
        eventTypes: ['sale.confirmed' as const],
        excludeOwnChanges: true,
        integrationClientId: null,
    }

    it('requires a full URL and an event', () => {
        const result = webhookEndpointCreateSchema.safeParse({
            ...ENDPOINT,
            url: 'tienda.example',
            eventTypes: [],
        })
        const paths = result.error?.issues.map((i) => i.path[0])
        expect(paths).toEqual(expect.arrayContaining(['url', 'eventTypes']))
    })

    it('leaves the public-address check to the core', () => {
        // El core decide con WEBHOOK_URL_NOT_ALLOWED; en local acepta localhost
        expect(
            webhookEndpointCreateSchema.safeParse({
                ...ENDPOINT,
                url: 'http://localhost:4000/hooks',
            }).success
        ).toBe(true)
    })

    it('only excludes own changes for an endpoint with an owner', () => {
        expect(toWebhookEndpointInput(ENDPOINT)).toEqual({
            url: 'https://tienda.example/webhooks/faclab',
            eventTypes: ['sale.confirmed'],
            description: null,
            excludeOwnChanges: false,
            integrationClientId: null,
        })
        expect(
            toWebhookEndpointInput({ ...ENDPOINT, integrationClientId: 4 })
                .excludeOwnChanges
        ).toBe(true)
    })
})
