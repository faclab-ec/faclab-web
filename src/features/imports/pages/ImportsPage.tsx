import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Card from '@/components/ui/Card'
import DataTable, { type ColumnDef } from '@/components/shared/DataTable'
import EmptyState from '@/components/shared/EmptyState'
import PageHeader from '@/components/shared/PageHeader'
import StatusBadge from '@/components/shared/StatusBadge'
import { formatDatetime } from '@shared/lib/format'
import { notifyError } from '@shared/ui/notify'
import ImportUploadForm from '../components/ImportUploadForm'
import { useImports, useUploadImport } from '../hooks/useImports'
import {
    IMPORT_ERROR_MESSAGES,
    IMPORT_KIND_LABELS,
    IMPORT_STATUS_LABELS,
    IMPORT_STATUS_TONES,
    type ImportJob,
    type ImportUpload,
} from '../model/types'

const columns: ColumnDef<ImportJob>[] = [
    {
        header: 'Fecha',
        id: 'createdAt',
        cell: (props) => (
            <span className="whitespace-nowrap text-sm">
                {props.row.original.createdAt
                    ? formatDatetime(props.row.original.createdAt)
                    : '—'}
            </span>
        ),
    },
    {
        header: 'Qué',
        id: 'kind',
        cell: (props) => IMPORT_KIND_LABELS[props.row.original.kind],
    },
    {
        header: 'Archivo',
        id: 'fileName',
        cell: (props) => (
            <Link
                className="text-primary-600 hover:underline"
                to={`/settings/imports/${props.row.original.id}`}
            >
                {props.row.original.fileName}
            </Link>
        ),
    },
    {
        header: 'Filas',
        id: 'totalRows',
        cell: (props) => props.row.original.totalRows.toLocaleString('es-EC'),
    },
    {
        header: 'Estado',
        id: 'status',
        cell: (props) => (
            <StatusBadge tone={IMPORT_STATUS_TONES[props.row.original.status]}>
                {IMPORT_STATUS_LABELS[props.row.original.status]}
            </StatusBadge>
        ),
    },
    {
        header: 'Subida por',
        id: 'userName',
        cell: (props) => props.row.original.userName ?? '—',
    },
]

/**
 * Importación masiva (S5.8): se elige la plantilla, se sube el archivo y se ve
 * qué haría cada fila antes de importar nada. Abajo, las importaciones hechas.
 */
const ImportsPage = () => {
    const navigate = useNavigate()
    const upload = useUploadImport()
    const [pageIndex, setPageIndex] = useState(1)
    const [pageSize, setPageSize] = useState(10)
    const { data, isLoading, error, refetch } = useImports({
        limit: pageSize,
        offset: (pageIndex - 1) * pageSize,
    })

    const submit = async (file: ImportUpload) => {
        try {
            const job = await upload.mutateAsync(file)
            navigate(`/settings/imports/${job.id}`)
        } catch (err) {
            notifyError(err, 'No se pudo leer el archivo', {
                messages: IMPORT_ERROR_MESSAGES,
            })
        }
    }

    return (
        <>
            <PageHeader
                title="Importar datos"
                description="Carga productos, presentaciones, precios, clientes, proveedores y saldos iniciales desde Excel o CSV. Primero se valida todo el archivo; nada se importa hasta que lo confirmes."
            />
            <Card className="mb-4">
                <ImportUploadForm
                    uploading={upload.isPending}
                    onSubmit={submit}
                />
            </Card>
            <h2 className="mb-3 text-lg font-semibold">Importaciones</h2>
            <Card bodyClass="p-0">
                <DataTable
                    columns={columns}
                    data={data?.items ?? []}
                    loading={isLoading}
                    error={error}
                    emptyState={
                        <EmptyState
                            title="Todavía no hay importaciones"
                            description="Empieza por los productos: las demás plantillas los buscan por su SKU."
                        />
                    }
                    pagingData={{
                        total: data?.pagination?.total ?? 0,
                        pageIndex,
                        pageSize,
                    }}
                    onRetry={refetch}
                    onPaginationChange={setPageIndex}
                    onSelectChange={(size) => {
                        setPageSize(size)
                        setPageIndex(1)
                    }}
                />
            </Card>
        </>
    )
}

export default ImportsPage
