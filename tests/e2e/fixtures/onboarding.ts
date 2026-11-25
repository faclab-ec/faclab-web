import type {
    CoreChecklist,
    TestInvoice,
} from '@/features/onboarding/model/types'
import type { CompanyConfig } from '@/features/invoicing/model/types'
import { TENANT } from '../support/session'

/** GET /api/admin/onboarding de una empresa que ya armó lo suyo en core */
export const builtChecklist = (): CoreChecklist => ({
    ready: true,
    steps: [
        { key: 'branches', done: true, count: 1, required: true },
        { key: 'emission_points', done: true, count: 1, required: true },
        { key: 'terminals', done: true, count: 1, required: true },
        { key: 'users', done: false, count: 1, required: false },
        { key: 'import', done: false, count: 0, required: false },
    ],
})

/** Una empresa recién creada: solo la matriz que trae el alta */
export const freshChecklist = (): CoreChecklist => ({
    ready: false,
    steps: [
        { key: 'branches', done: true, count: 1, required: true },
        { key: 'emission_points', done: true, count: 1, required: true },
        { key: 'terminals', done: true, count: 1, required: true },
        { key: 'users', done: false, count: 1, required: false },
        { key: 'import', done: false, count: 0, required: false },
    ],
})

export const testInvoice = (
    overrides: Partial<TestInvoice> = {}
): TestInvoice => ({
    status: 'NONE',
    id: null,
    number: null,
    authorizedAt: null,
    reason: null,
    ...overrides,
})

export const profile = (
    overrides: Partial<CompanyConfig> = {}
): CompanyConfig => ({
    taxId: TENANT.ruc,
    name: TENANT.legalName,
    tradeName: 'El Tornillo',
    mainAddress: 'Av. Loja 1-23, Cuenca',
    specialTaxpayerResolution: null,
    withholdingAgentResolution: null,
    rimpeRegime: null,
    accountingRequired: false,
    environment: 1,
    emissionType: 1,
    signingCertId: 'cert-1',
    email: null,
    hasLogo: false,
    updatedAt: '2026-01-15T14:00:00.000Z',
    ...overrides,
})
