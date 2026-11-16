import type { ImportJob, ImportRow, ImportTemplate } from '@features/imports'
import {
    ADMIN,
    created,
    file,
    ok,
    paginated,
    type MockApi,
} from '../support/mockApi'

const COUNTS = { create: 0, update: 0, unchanged: 0, skip: 0, error: 0 }
const XLSX = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

/** Las plantillas de faclab-core, con un par de columnas cada una */
export const importTemplates = (): ImportTemplate[] => [
    {
        kind: 'PRODUCTS',
        fileName: 'productos',
        columns: [
            {
                name: 'sku',
                description: 'Código interno del producto, único en la empresa',
                example: 'TOR-0001',
                key: true,
                required: true,
            },
            {
                name: 'unidad',
                description: 'Símbolo de la unidad base (debe existir)',
                example: 'und',
                key: false,
                required: true,
            },
        ],
    },
    ...(
        ['PRESENTATIONS', 'PRICES', 'CUSTOMERS', 'SUPPLIERS', 'STOCK'] as const
    ).map((kind) => ({
        kind,
        fileName: kind.toLowerCase(),
        columns: [
            {
                name: 'sku',
                description: 'SKU del producto',
                example: 'TOR-0001',
                key: true,
                required: true,
            },
        ],
    })),
]

export const importJob = (overrides: Partial<ImportJob> = {}): ImportJob => ({
    id: 1,
    kind: 'PRODUCTS',
    mode: 'SKIP',
    status: 'VALIDATED',
    fileName: 'productos.csv',
    fileSize: 1200,
    totalRows: 2,
    processedRows: 0,
    planned: { ...COUNTS, create: 2 },
    done: COUNTS,
    userName: 'Admin',
    failedRow: null,
    failure: null,
    createdAt: '2026-11-16T10:00:00',
    confirmedAt: null,
    startedAt: null,
    finishedAt: null,
    ...overrides,
})

const errorRow = (): ImportRow => ({
    id: 11,
    rowNumber: 4,
    action: 'ERROR',
    errors: [
        {
            column: 'unidad',
            code: 'NOT_FOUND',
            message: 'No existe la unidad kg',
        },
    ],
    data: { sku: 'PAL-1', unidad: 'kg' },
    recordId: null,
})

/**
 * Importaciones con estado en memoria: un archivo cuyo nombre lleva "errores"
 * queda INVALID; otro, VALIDATED. Confirmada, la importación avanza un paso en
 * cada consulta (RUNNING y luego COMPLETED), como si el worker la corriera.
 */
export const mockImports = (api: MockApi): { jobs: ImportJob[] } => {
    const state = { jobs: [] as ImportJob[] }
    const find = (id: string) =>
        state.jobs.find((job) => job.id === Number(id)) ?? importJob()

    api.get(`${ADMIN}/imports`, ({ query }) =>
        paginated([...state.jobs].reverse(), query)
    )
    api.get(`${ADMIN}/imports/:id`, ({ params }) => {
        const job = find(params.id)
        if (job.status === 'QUEUED') {
            Object.assign(job, { status: 'RUNNING', processedRows: 1 })
            return ok({ ...job })
        }
        if (job.status === 'RUNNING') {
            Object.assign(job, {
                status: 'COMPLETED',
                processedRows: job.totalRows,
                done: { ...COUNTS, create: job.totalRows },
                finishedAt: '2026-11-16T10:05:00',
            })
        }
        return ok({ ...job })
    })
    // After `:id`: the last one registered wins
    api.get(`${ADMIN}/imports/templates`, () => ok(importTemplates()))
    api.get(`${ADMIN}/imports/templates/:kind`, () =>
        file('sku,unidad\n', XLSX)
    )
    api.get(`${ADMIN}/imports/:id/rows`, ({ query }) =>
        paginated([errorRow()], query)
    )
    api.get(`${ADMIN}/imports/:id/errors`, () =>
        file('fila,columna,codigo,mensaje\n', XLSX)
    )
    api.post(`${ADMIN}/imports`, ({ body }) => {
        const withErrors = String(body).includes('errores')
        const job = importJob({
            id: state.jobs.length + 1,
            fileName: withErrors
                ? 'productos-con-errores.csv'
                : 'productos.csv',
            status: withErrors ? 'INVALID' : 'VALIDATED',
            totalRows: withErrors ? 3 : 2,
            planned: withErrors
                ? { ...COUNTS, create: 2, error: 1 }
                : { ...COUNTS, create: 2 },
        })
        state.jobs.push(job)
        return created(job)
    })
    api.post(`${ADMIN}/imports/:id/confirm`, ({ params }) => {
        const job = find(params.id)
        Object.assign(job, {
            status: 'QUEUED',
            confirmedAt: '2026-11-16T10:01:00',
        })
        return ok({ ...job })
    })
    return state
}
