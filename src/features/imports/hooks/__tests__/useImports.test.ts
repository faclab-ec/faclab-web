import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'
import {
    PROGRESS_INTERVAL_MS,
    useConfirmImport,
    useImport,
    useImportDownloads,
    useImportRows,
    useImports,
    useUploadImport,
} from '../useImports'
import * as api from '../../api/client'
import type { ImportJob, ImportRow } from '../../model/types'
import { saveFile } from '@shared/lib/saveFile'

vi.mock('../../api/client')
vi.mock('@shared/lib/saveFile', () => ({ saveFile: vi.fn() }))

const META = { requestId: 'req-1', timestamp: '2026-11-16T00:00:00Z' }
const COUNTS = { create: 0, update: 0, unchanged: 0, skip: 0, error: 0 }

const JOB: ImportJob = {
    id: 7,
    kind: 'PRODUCTS',
    mode: 'SKIP',
    status: 'VALIDATED',
    fileName: 'productos.xlsx',
    fileSize: 2048,
    totalRows: 2,
    processedRows: 0,
    planned: { ...COUNTS, create: 2 },
    done: COUNTS,
    userName: 'Ana Pérez',
    failedRow: null,
    failure: null,
    createdAt: '2026-11-16T10:00:00',
    confirmedAt: null,
    startedAt: null,
    finishedAt: null,
}

const ERROR_ROW: ImportRow = {
    id: 3,
    rowNumber: 4,
    action: 'ERROR',
    errors: [
        {
            column: 'unidad',
            code: 'NOT_FOUND',
            message: 'No existe la unidad kg',
        },
    ],
    data: { sku: 'A-1', unidad: 'kg' },
    recordId: null,
}

let qc: QueryClient

function wrapper({ children }: { children: React.ReactNode }) {
    return createElement(QueryClientProvider, { client: qc }, children)
}

beforeEach(() => {
    vi.clearAllMocks()
    qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
})

describe('useImports', () => {
    it('unwraps the imports and their pagination', async () => {
        vi.mocked(api.getImports).mockResolvedValue({
            data: [JOB],
            meta: { ...META, pagination: { total: 1, limit: 10, offset: 0 } },
        })

        const { result } = renderHook(() => useImports({ limit: 10 }), {
            wrapper,
        })

        await waitFor(() => expect(result.current.isSuccess).toBe(true))
        expect(result.current.data?.items).toEqual([JOB])
        expect(result.current.data?.pagination.total).toBe(1)
        expect(api.getImports).toHaveBeenCalledWith({ limit: 10 })
    })
})

describe('useImport', () => {
    it('asks again for an import while it runs, and stops when it ends', async () => {
        vi.useFakeTimers({ shouldAdvanceTime: true })
        try {
            vi.mocked(api.getImport)
                .mockResolvedValueOnce({
                    data: { ...JOB, status: 'RUNNING', processedRows: 1 },
                    meta: META,
                })
                .mockResolvedValue({
                    data: { ...JOB, status: 'COMPLETED', processedRows: 2 },
                    meta: META,
                })

            const { result } = renderHook(() => useImport(7), { wrapper })

            await waitFor(() =>
                expect(result.current.data?.status).toBe('RUNNING')
            )
            await act(async () => {
                await vi.advanceTimersByTimeAsync(PROGRESS_INTERVAL_MS)
            })
            await waitFor(() =>
                expect(result.current.data?.status).toBe('COMPLETED')
            )
            await act(async () => {
                await vi.advanceTimersByTimeAsync(PROGRESS_INTERVAL_MS * 3)
            })
            expect(api.getImport).toHaveBeenCalledTimes(2)
        } finally {
            vi.useRealTimers()
        }
    })
})

describe('useImportRows', () => {
    it('reads only the rows with errors', async () => {
        vi.mocked(api.getImportRows).mockResolvedValue({
            data: [ERROR_ROW],
            meta: { ...META, pagination: { total: 1, limit: 10, offset: 0 } },
        })

        const { result } = renderHook(
            () => useImportRows(7, { action: 'ERROR', limit: 10, offset: 0 }),
            { wrapper }
        )

        await waitFor(() => expect(result.current.isSuccess).toBe(true))
        expect(result.current.data?.items).toEqual([ERROR_ROW])
        expect(api.getImportRows).toHaveBeenCalledWith(7, {
            action: 'ERROR',
            limit: 10,
            offset: 0,
        })
    })
})

describe('mutations', () => {
    it('uploads a file and keeps the validated import in the cache', async () => {
        vi.mocked(api.uploadImport).mockResolvedValue({ data: JOB, meta: META })
        const file = new File(['sku\nA-1\n'], 'productos.csv')

        const { result } = renderHook(() => useUploadImport(), { wrapper })
        await act(() =>
            result.current.mutateAsync({ kind: 'PRODUCTS', mode: 'SKIP', file })
        )

        expect(api.uploadImport).toHaveBeenCalledWith({
            kind: 'PRODUCTS',
            mode: 'SKIP',
            file,
        })
        expect(qc.getQueryData(['imports', 7])).toEqual(JOB)
    })

    it('confirms an import and updates it in the cache', async () => {
        const queued = { ...JOB, status: 'QUEUED' as const }
        vi.mocked(api.confirmImport).mockResolvedValue({
            data: queued,
            meta: META,
        })

        const { result } = renderHook(() => useConfirmImport(), { wrapper })
        await act(() => result.current.mutateAsync(7))

        expect(api.confirmImport).toHaveBeenCalledWith(7)
        expect(qc.getQueryData(['imports', 7])).toEqual(queued)
    })
})

describe('useImportDownloads', () => {
    it('saves a template and an error report with their names', async () => {
        const blob = new Blob(['x'])
        vi.mocked(api.downloadImportTemplate).mockResolvedValue(blob)
        vi.mocked(api.downloadImportErrors).mockResolvedValue(blob)

        const { result } = renderHook(() => useImportDownloads(), { wrapper })
        await act(() => result.current.template('STOCK', 'csv'))
        await act(() => result.current.errors({ id: 7 }))

        expect(api.downloadImportTemplate).toHaveBeenCalledWith('STOCK', 'csv')
        expect(api.downloadImportErrors).toHaveBeenCalledWith(7, 'xlsx')
        expect(vi.mocked(saveFile).mock.calls).toEqual([
            [blob, 'plantilla-saldos-iniciales.csv'],
            [blob, 'errores-importacion-7.xlsx'],
        ])
    })
})
