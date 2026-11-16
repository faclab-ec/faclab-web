import { useState } from 'react'
import DataTable, { type ColumnDef } from '@/components/shared/DataTable'
import EmptyState from '@/components/shared/EmptyState'
import { useImportRows } from '../hooks/useImports'
import type { ImportRow } from '../model/types'

const columns: ColumnDef<ImportRow>[] = [
    {
        header: 'Fila',
        id: 'rowNumber',
        cell: (props) => props.row.original.rowNumber,
    },
    {
        header: 'Problemas',
        id: 'errors',
        cell: (props) => (
            <ul className="space-y-1 text-sm">
                {props.row.original.errors.map((error, index) => (
                    <li key={index}>
                        {error.column && (
                            <code className="mr-1 text-xs">{error.column}</code>
                        )}
                        {error.message}
                    </li>
                ))}
            </ul>
        ),
    },
]

/** Las filas con errores de una importación, en orden */
const ImportErrorsTable = ({ importId }: { importId: number }) => {
    const [pageIndex, setPageIndex] = useState(1)
    const [pageSize, setPageSize] = useState(10)
    const { data, isLoading, error, refetch } = useImportRows(importId, {
        action: 'ERROR',
        limit: pageSize,
        offset: (pageIndex - 1) * pageSize,
    })

    return (
        <DataTable
            columns={columns}
            data={data?.items ?? []}
            loading={isLoading}
            error={error}
            emptyState={<EmptyState title="Ninguna fila tiene errores" />}
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
    )
}

export default ImportErrorsTable
