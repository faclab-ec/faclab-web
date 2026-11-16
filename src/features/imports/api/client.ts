import appConfig from '@/configs/app.config'
import { httpClient } from '@shared/lib/http/httpClient'
import type { DataResponse, PaginatedResponse } from '@/@types/api'
import type {
    ImportJob,
    ImportKind,
    ImportParams,
    ImportRow,
    ImportRowParams,
    ImportTemplate,
    ImportUpload,
    SheetFormat,
} from '../model/types'

const HOST = `${appConfig.inventoryApiHost}/imports`

// Subir y validar 50.000 filas toma más que el timeout general
const UPLOAD_TIMEOUT_MS = 5 * 60 * 1000

export const getImportTemplates = () =>
    httpClient.get<DataResponse<ImportTemplate[]>>(`${HOST}/templates`)

export const downloadImportTemplate = (kind: ImportKind, format: SheetFormat) =>
    httpClient.getBlob(`${HOST}/templates/${kind}`, { params: { format } })

/** Sube el archivo: faclab-core lo valida sin importar nada */
export const uploadImport = ({ kind, mode, file }: ImportUpload) => {
    const form = new FormData()
    form.append('kind', kind)
    form.append('mode', mode)
    form.append('file', file)
    return httpClient.post<DataResponse<ImportJob>>(HOST, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: UPLOAD_TIMEOUT_MS,
    })
}

export const getImports = (params?: ImportParams) =>
    httpClient.get<PaginatedResponse<ImportJob>>(HOST, { params })

export const getImport = (id: number) =>
    httpClient.get<DataResponse<ImportJob>>(`${HOST}/${id}`)

export const getImportRows = (id: number, params?: ImportRowParams) =>
    httpClient.get<PaginatedResponse<ImportRow>>(`${HOST}/${id}/rows`, {
        params,
    })

export const downloadImportErrors = (id: number, format: SheetFormat) =>
    httpClient.getBlob(`${HOST}/${id}/errors`, { params: { format } })

/** La deja en cola: el worker la importa */
export const confirmImport = (id: number) =>
    httpClient.post<DataResponse<ImportJob>>(`${HOST}/${id}/confirm`)
