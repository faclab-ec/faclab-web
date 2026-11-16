import { describe, expect, it } from 'vitest'
import {
    IMPORT_KINDS,
    IMPORT_KIND_LABELS,
    IMPORT_STATUSES,
    IMPORT_STATUS_LABELS,
    IMPORT_STATUS_TONES,
    fileProblem,
    importProgress,
    isImportInProgress,
    type ImportJob,
} from '../types'

const COUNTS = { create: 0, update: 0, unchanged: 0, skip: 0, error: 0 }

const job = (overrides: Partial<ImportJob> = {}): ImportJob => ({
    id: 1,
    kind: 'PRODUCTS',
    mode: 'SKIP',
    status: 'RUNNING',
    fileName: 'productos.xlsx',
    fileSize: 1024,
    totalRows: 3,
    processedRows: 0,
    planned: { ...COUNTS, create: 3 },
    done: COUNTS,
    userName: 'Ana Pérez',
    failedRow: null,
    failure: null,
    createdAt: '2026-11-16T10:00:00',
    confirmedAt: null,
    startedAt: null,
    finishedAt: null,
    ...overrides,
})

const file = (name: string, size: number) =>
    new File([new Uint8Array(size)], name)

describe('import model', () => {
    it('labels every kind and status, each status with its tone', () => {
        for (const kind of IMPORT_KINDS)
            expect(IMPORT_KIND_LABELS[kind]).toBeTruthy()
        for (const status of IMPORT_STATUSES) {
            expect(IMPORT_STATUS_LABELS[status]).toBeTruthy()
            expect(IMPORT_STATUS_TONES[status]).toBeTruthy()
        }
    })

    it('is in progress while queued or running', () => {
        expect(isImportInProgress('QUEUED')).toBe(true)
        expect(isImportInProgress('RUNNING')).toBe(true)
        expect(isImportInProgress('VALIDATED')).toBe(false)
        expect(isImportInProgress('COMPLETED')).toBe(false)
    })

    it('measures the progress by the rows the worker already ran', () => {
        expect(importProgress(job({ processedRows: 0 }))).toBe(0)
        expect(importProgress(job({ processedRows: 2 }))).toBe(66)
        expect(importProgress(job({ processedRows: 3 }))).toBe(100)
        expect(importProgress(job({ totalRows: 0 }))).toBe(0)
    })

    it('accepts only CSV or XLSX files up to 10 MB', () => {
        expect(fileProblem(file('productos.csv', 10))).toBeNull()
        expect(fileProblem(file('PRODUCTOS.XLSX', 10))).toBeNull()
        expect(fileProblem(file('productos.xls', 10))).toMatch(/\.xlsx/)
        expect(fileProblem(file('productos.csv', 0))).toMatch(/vacío/)
        expect(
            fileProblem(file('productos.csv', 10 * 1024 * 1024 + 1))
        ).toMatch(/10 MB/)
    })
})
