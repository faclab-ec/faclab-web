import { describe, expect, it } from 'vitest'
import type { CompanyConfig, InvoicingStatus } from '@features/invoicing'
import {
    buildSteps,
    currentStep,
    readyToInvoice,
    type StepsInput,
} from '../model/steps'
import type { CoreChecklist, TestInvoice } from '../model/types'

const CONFIG = { taxId: '1799999990001', environment: 1 } as CompanyConfig

const CORE: CoreChecklist = {
    ready: true,
    steps: [
        { key: 'branches', done: true, count: 1, required: true },
        { key: 'emission_points', done: true, count: 1, required: true },
        { key: 'terminals', done: true, count: 1, required: true },
        { key: 'users', done: false, count: 1, required: false },
        { key: 'import', done: false, count: 0, required: false },
    ],
}

const READY: InvoicingStatus = {
    ready: true,
    environment: 1,
    certificate: {
        id: 'c1',
        subject: 'CN=ACME',
        validTo: '2027-01-01T00:00:00Z',
    },
    issues: [],
    pendingInvoices: 0,
    invoicesWithIssues: 0,
}

const AUTHORIZED: TestInvoice = {
    status: 'AUTHORIZED',
    id: 'i1',
    number: '001-001-000000001',
    authorizedAt: '2026-11-25T10:00:00Z',
    reason: null,
}

const input = (overrides: Partial<StepsInput> = {}): StepsInput => ({
    core: CORE,
    config: CONFIG,
    invoicing: READY,
    hasSequences: false,
    testInvoice: AUTHORIZED,
    ...overrides,
})

const stateOf = (steps: ReturnType<typeof buildSteps>, key: string) =>
    steps.find((step) => step.key === key)?.state

describe('the onboarding steps', () => {
    it('start with the fiscal profile on a new company, and block what depends on it', () => {
        const steps = buildSteps(
            input({
                config: null,
                invoicing: { ...READY, ready: false, certificate: null },
                testInvoice: undefined,
                core: CORE,
            })
        )

        expect(stateOf(steps, 'fiscal-profile')).toBe('pending')
        expect(stateOf(steps, 'certificate')).toBe('blocked')
        expect(stateOf(steps, 'verification')).toBe('blocked')
        expect(stateOf(steps, 'production')).toBe('blocked')
        expect(currentStep(steps)?.key).toBe('fiscal-profile')
        expect(readyToInvoice(steps)).toBe(false)
    })

    it('count what was done outside the wizard', () => {
        const steps = buildSteps(input({ testInvoice: undefined }))

        expect(stateOf(steps, 'fiscal-profile')).toBe('done')
        expect(stateOf(steps, 'certificate')).toBe('done')
        expect(stateOf(steps, 'branches')).toBe('done')
        expect(stateOf(steps, 'terminals')).toBe('done')
        // Verification waits for the test invoice
        expect(stateOf(steps, 'verification')).toBe('pending')
        expect(currentStep(steps)?.key).toBe('verification')
    })

    it('does not take a certificate with errors as done', () => {
        const steps = buildSteps(
            input({
                invoicing: {
                    ...READY,
                    ready: false,
                    issues: [
                        {
                            code: 'CERTIFICATE_EXPIRED',
                            severity: 'error',
                            message: 'vencido',
                        },
                    ],
                },
            })
        )

        expect(stateOf(steps, 'certificate')).toBe('pending')
        expect(stateOf(steps, 'verification')).toBe('blocked')
    })

    it('is ready to invoice in testing with an authorized test invoice, before production', () => {
        const steps = buildSteps(input())

        expect(stateOf(steps, 'verification')).toBe('done')
        expect(readyToInvoice(steps)).toBe(true)
        // Production is open, not done, and it is the next step
        expect(stateOf(steps, 'production')).toBe('pending')
        expect(currentStep(steps)?.key).toBe('production')
    })

    it('keeps production blocked while the test invoice is processing or rejected', () => {
        for (const status of ['PROCESSING', 'REJECTED'] as const) {
            const steps = buildSteps(
                input({ testInvoice: { ...AUTHORIZED, status } })
            )
            expect(stateOf(steps, 'verification')).toBe('pending')
            expect(stateOf(steps, 'production')).toBe('blocked')
        }
    })

    it('marks production done once the issuer is there', () => {
        const steps = buildSteps(
            input({
                invoicing: { ...READY, environment: 2 },
                testInvoice: undefined,
            })
        )

        expect(stateOf(steps, 'production')).toBe('done')
    })

    it('leaves the optional steps out of what is needed', () => {
        const steps = buildSteps(input())

        expect(steps.filter((step) => step.optional).map((s) => s.key)).toEqual(
            ['users', 'import', 'sequences']
        )
        expect(readyToInvoice(steps)).toBe(true)
    })
})
