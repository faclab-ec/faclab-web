import { useState } from 'react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import DataTable, { type ColumnDef } from '@/components/shared/DataTable'
import PageHeader from '@/components/shared/PageHeader'
import { useBranchesList, useEmissionPointsList } from '@features/organization'
import { useSequences } from '../hooks/useInvoicing'
import { sequenceRows, type SequenceRow } from '../model/sequences'
import NextSequenceModal from '../components/NextSequenceModal'

// Una ferretería tiene pocas sucursales y puntos de emisión: se traen todos
const ALL = { limit: 1000 }

const SequencesPage = () => {
    const branches = useBranchesList(ALL)
    const emissionPoints = useEmissionPointsList(ALL)
    const sequences = useSequences()
    const [editing, setEditing] = useState<SequenceRow | null>(null)

    const queries = [branches, emissionPoints, sequences]
    const rows =
        branches.data && emissionPoints.data && sequences.data
            ? sequenceRows(
                  branches.data.items,
                  emissionPoints.data.items,
                  sequences.data
              )
            : []

    const columns: ColumnDef<SequenceRow>[] = [
        {
            header: 'Establecimiento',
            accessorKey: 'establishment',
            cell: (props) => (
                <span>
                    <span className="font-mono">
                        {props.row.original.establishment}
                    </span>{' '}
                    <span className="text-gray-500 dark:text-gray-400">
                        {props.row.original.branchName ??
                            'No está en Sucursales'}
                    </span>
                </span>
            ),
        },
        {
            header: 'Punto de emisión',
            accessorKey: 'emissionPoint',
            cell: (props) => (
                <span>
                    <span className="font-mono">
                        {props.row.original.emissionPoint}
                    </span>{' '}
                    {props.row.original.emissionPointName && (
                        <span className="text-gray-500 dark:text-gray-400">
                            {props.row.original.emissionPointName}
                        </span>
                    )}
                </span>
            ),
        },
        {
            header: 'Último emitido',
            accessorKey: 'lastSequence',
            cell: (props) => (
                <span className="font-mono">
                    {props.row.original.lastSequence ?? '—'}
                </span>
            ),
        },
        {
            header: 'Siguiente',
            accessorKey: 'nextSequence',
            cell: (props) => (
                <span className="font-mono font-semibold">
                    {props.row.original.nextSequence}
                </span>
            ),
        },
        {
            header: 'Acciones',
            id: 'actions',
            cell: (props) => (
                <Button
                    size="xs"
                    variant="plain"
                    aria-label={`Ajustar secuencial ${props.row.original.establishment}-${props.row.original.emissionPoint}`}
                    onClick={() => setEditing(props.row.original)}
                >
                    Ajustar
                </Button>
            ),
        },
    ]

    return (
        <>
            <PageHeader
                title="Secuenciales"
                description="Número de la próxima factura de cada establecimiento y punto de emisión. Nunca retrocede."
            />
            <Card bodyClass="p-0">
                <DataTable
                    columns={columns}
                    data={rows}
                    loading={queries.some((q) => q.isLoading)}
                    error={queries.find((q) => q.error)?.error}
                    onRetry={() => queries.forEach((q) => q.refetch())}
                />
            </Card>
            {editing && (
                <NextSequenceModal
                    row={editing}
                    onClose={() => setEditing(null)}
                />
            )}
        </>
    )
}

export default SequencesPage
