import { useState } from 'react'
import {
    keepPreviousData,
    useMutation,
    useQuery,
    useQueryClient,
} from '@tanstack/react-query'
import { saveFile } from '@shared/lib/saveFile'
import { notifyError } from '@shared/ui/notify'
import * as api from '../api/client'
import {
    IMPORT_ERROR_MESSAGES,
    isImportInProgress,
    type ImportJob,
    type ImportKind,
    type ImportParams,
    type ImportRowParams,
    type ImportUpload,
    type SheetFormat,
} from '../model/types'

export const IMPORTS_KEY = ['imports'] as const

/** Cada cuánto se pregunta por una importación en curso */
export const PROGRESS_INTERVAL_MS = 2_000

export const useImportTemplates = () =>
    useQuery({
        queryKey: [...IMPORTS_KEY, 'templates'],
        queryFn: async () => (await api.getImportTemplates()).data,
        staleTime: Infinity,
    })

export const useImports = (params?: ImportParams) =>
    useQuery({
        queryKey: [...IMPORTS_KEY, 'list', params],
        queryFn: async () => {
            const body = await api.getImports(params)
            return { items: body.data, pagination: body.meta.pagination }
        },
        placeholderData: keepPreviousData,
        refetchInterval: (query) =>
            query.state.data?.items.some((job) =>
                isImportInProgress(job.status)
            )
                ? PROGRESS_INTERVAL_MS
                : false,
    })

/** Una importación; mientras está en cola o importando, su progreso */
export const useImport = (id: number) =>
    useQuery({
        queryKey: [...IMPORTS_KEY, id],
        queryFn: async () => (await api.getImport(id)).data,
        enabled: id > 0,
        refetchInterval: (query) =>
            query.state.data && isImportInProgress(query.state.data.status)
                ? PROGRESS_INTERVAL_MS
                : false,
    })

export const useImportRows = (
    id: number,
    params: ImportRowParams,
    enabled = true
) =>
    useQuery({
        queryKey: [...IMPORTS_KEY, id, 'rows', params],
        queryFn: async () => {
            const body = await api.getImportRows(id, params)
            return { items: body.data, pagination: body.meta.pagination }
        },
        enabled: enabled && id > 0,
        placeholderData: keepPreviousData,
    })

export const useUploadImport = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async (upload: ImportUpload) =>
            (await api.uploadImport(upload)).data,
        onSuccess: (job) => {
            queryClient.setQueryData([...IMPORTS_KEY, job.id], job)
            queryClient.invalidateQueries({
                queryKey: [...IMPORTS_KEY, 'list'],
            })
        },
    })
}

export const useConfirmImport = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async (id: number) => (await api.confirmImport(id)).data,
        onSuccess: (job) => {
            queryClient.setQueryData([...IMPORTS_KEY, job.id], job)
            queryClient.invalidateQueries({
                queryKey: [...IMPORTS_KEY, 'list'],
            })
        },
    })
}

/** Nombre de cada plantilla al descargarla (el `Content-Disposition` no se
 *  lee por CORS) */
const TEMPLATE_FILE_NAMES: Record<ImportKind, string> = {
    PRODUCTS: 'plantilla-productos',
    PRESENTATIONS: 'plantilla-presentaciones',
    PRICES: 'plantilla-precios',
    CUSTOMERS: 'plantilla-clientes',
    SUPPLIERS: 'plantilla-proveedores',
    STOCK: 'plantilla-saldos-iniciales',
}

/** Descarga de plantillas y del reporte de errores */
export function useImportDownloads() {
    const [busy, setBusy] = useState<string | null>(null)

    const run = async (
        key: string,
        fetch: () => Promise<Blob>,
        fileName: string,
        error: string
    ) => {
        setBusy(key)
        try {
            saveFile(await fetch(), fileName)
        } catch (err) {
            notifyError(err, error, { messages: IMPORT_ERROR_MESSAGES })
        } finally {
            setBusy(null)
        }
    }

    const template = (kind: ImportKind, format: SheetFormat) =>
        run(
            `template:${kind}:${format}`,
            () => api.downloadImportTemplate(kind, format),
            `${TEMPLATE_FILE_NAMES[kind]}.${format}`,
            'No se pudo descargar la plantilla'
        )

    const errors = (job: Pick<ImportJob, 'id'>, format: SheetFormat = 'xlsx') =>
        run(
            `errors:${job.id}`,
            () => api.downloadImportErrors(job.id, format),
            `errores-importacion-${job.id}.${format}`,
            'No se pudo descargar el reporte de errores'
        )

    const isBusy = (key: string) => busy === key

    return { template, errors, isBusy }
}
