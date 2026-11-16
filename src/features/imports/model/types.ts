import type { StatusTone } from '@shared/lib/statusTone'

/**
 * Importación masiva de datos iniciales (S5.8). Un archivo CSV o XLSX sigue
 * una de seis plantillas; faclab-core valida cada fila sin escribir nada y,
 * confirmada, el worker la importa por lotes con los comandos de cada módulo.
 */
export const IMPORT_KINDS = [
    'PRODUCTS',
    'PRESENTATIONS',
    'PRICES',
    'CUSTOMERS',
    'SUPPLIERS',
    'STOCK',
] as const
export type ImportKind = (typeof IMPORT_KINDS)[number]

export const IMPORT_KIND_LABELS: Record<ImportKind, string> = {
    PRODUCTS: 'Productos',
    PRESENTATIONS: 'Presentaciones',
    PRICES: 'Precios por lista',
    CUSTOMERS: 'Clientes',
    SUPPLIERS: 'Proveedores',
    STOCK: 'Saldos iniciales de inventario',
}

/** Qué hacer con una fila cuyo registro ya existe */
export const IMPORT_MODES = ['SKIP', 'UPDATE'] as const
export type ImportMode = (typeof IMPORT_MODES)[number]

export const IMPORT_MODE_LABELS: Record<ImportMode, string> = {
    SKIP: 'Solo crear los nuevos',
    UPDATE: 'Crear los nuevos y actualizar los que existen',
}

export const IMPORT_MODE_HINTS: Record<ImportMode, string> = {
    SKIP: 'Las filas de registros que ya existen se saltan.',
    UPDATE: 'Las celdas llenas actualizan el registro; una celda vacía conserva su valor.',
}

export const IMPORT_STATUSES = [
    'VALIDATED',
    'INVALID',
    'QUEUED',
    'RUNNING',
    'COMPLETED',
    'FAILED',
] as const
export type ImportStatus = (typeof IMPORT_STATUSES)[number]

export const IMPORT_STATUS_LABELS: Record<ImportStatus, string> = {
    VALIDATED: 'Lista para importar',
    INVALID: 'Con errores',
    QUEUED: 'En cola',
    RUNNING: 'Importando',
    COMPLETED: 'Completada',
    FAILED: 'Detenida',
}

export const IMPORT_STATUS_TONES: Record<ImportStatus, StatusTone> = {
    VALIDATED: 'info',
    INVALID: 'danger',
    QUEUED: 'neutral',
    RUNNING: 'warning',
    COMPLETED: 'success',
    FAILED: 'danger',
}

/** Lo que la importación hace (o haría) con una fila */
export const IMPORT_ROW_ACTIONS = [
    'CREATE',
    'UPDATE',
    'UNCHANGED',
    'SKIP',
    'ERROR',
] as const
export type ImportRowAction = (typeof IMPORT_ROW_ACTIONS)[number]

export const IMPORT_ROW_ACTION_LABELS: Record<ImportRowAction, string> = {
    CREATE: 'Se crean',
    UPDATE: 'Se actualizan',
    UNCHANGED: 'Sin cambios',
    SKIP: 'Se saltan',
    ERROR: 'Con errores',
}

/** Filas por acción */
export interface ImportCounts {
    create: number
    update: number
    unchanged: number
    skip: number
    error: number
}

export interface ImportJob {
    id: number
    kind: ImportKind
    mode: ImportMode
    status: ImportStatus
    fileName: string
    /** Bytes */
    fileSize: number
    totalRows: number
    /** Filas que el worker ya ejecutó */
    processedRows: number
    /** Lo que haría cada fila, al validar el archivo */
    planned: ImportCounts
    /** Lo que el worker hizo */
    done: ImportCounts
    /** Quien lo subió */
    userName: string | null
    /** La fila que la detuvo */
    failedRow: number | null
    failure: string | null
    createdAt: string | null
    confirmedAt: string | null
    startedAt: string | null
    finishedAt: string | null
}

export interface ImportRowError {
    /** El encabezado de la plantilla; null: la fila entera */
    column: string | null
    code: string
    message: string
}

export interface ImportRow {
    id: number
    /** Su línea en la hoja (el encabezado es la 1) */
    rowNumber: number
    action: ImportRowAction
    errors: ImportRowError[]
    /** Las celdas de la fila por encabezado, tal como venían */
    data: Record<string, string | null>
    recordId: number | null
}

export interface ImportTemplateColumn {
    name: string
    description: string
    example: string
    /** Parte de lo que identifica el registro */
    key: boolean
    /** Necesaria para crear el registro */
    required: boolean
}

export interface ImportTemplate {
    kind: ImportKind
    fileName: string
    columns: ImportTemplateColumn[]
}

export interface ImportParams {
    kind?: ImportKind
    status?: ImportStatus
    limit?: number
    offset?: number
}

export interface ImportRowParams {
    action?: ImportRowAction
    limit?: number
    offset?: number
}

export type SheetFormat = 'xlsx' | 'csv'

export interface ImportUpload {
    kind: ImportKind
    mode: ImportMode
    file: File
}

/** Lo que acepta faclab-core (`IMPORT_MAX_FILE_BYTES`) */
export const IMPORT_MAX_FILE_BYTES = 10 * 1024 * 1024
export const IMPORT_ACCEPT = '.csv,.xlsx,text/csv'

export const isImportInProgress = (status: ImportStatus): boolean =>
    status === 'QUEUED' || status === 'RUNNING'

/** Porcentaje de filas ejecutadas, de 0 a 100 */
export const importProgress = (job: ImportJob): number =>
    job.totalRows > 0
        ? Math.min(100, Math.floor((job.processedRows * 100) / job.totalRows))
        : 0

/** Por qué no se puede subir un archivo, o null si se puede */
export const fileProblem = (file: File): string | null => {
    const name = file.name.toLowerCase()
    if (!name.endsWith('.csv') && !name.endsWith('.xlsx')) {
        return 'Sube un archivo .csv o .xlsx (guarda el .xls como .xlsx).'
    }
    if (file.size === 0) return 'El archivo está vacío.'
    if (file.size > IMPORT_MAX_FILE_BYTES) {
        return 'El archivo pasa de 10 MB: divídelo en varios.'
    }
    return null
}

export const IMPORT_ERROR_MESSAGES: Record<string, string> = {
    IMPORT_NOT_CONFIRMABLE:
        'Solo se confirma una importación validada sin errores, una vez.',
    REQUEST_TOO_LARGE: 'El archivo pasa de 10 MB: divídelo en varios.',
}
