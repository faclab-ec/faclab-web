import DataTable, { ColumnDef } from '@/components/shared/DataTable'
import Button from '@/components/ui/Button'
import { HiOutlineTrash } from 'react-icons/hi'
import type { Certificate } from '../model/types'

const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('es-EC', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    })

const isExpired = (validTo: string) => new Date(validTo) < new Date()

interface CertificatesTableProps {
    certificates: Certificate[]
    isLoading: boolean
    onDelete: (cert: Certificate) => void
}

const CertificatesTable = ({
    certificates,
    isLoading,
    onDelete,
}: CertificatesTableProps) => {
    const columns: ColumnDef<Certificate>[] = [
        {
            header: 'Archivo',
            accessorKey: 'fileName',
            cell: (props) => (
                <span className="font-medium">
                    {props.row.original.fileName}
                </span>
            ),
        },
        {
            header: 'Sujeto',
            accessorKey: 'subject',
            cell: (props) => (
                <span className="text-sm">{props.row.original.subject}</span>
            ),
        },
        {
            header: 'Emisor',
            accessorKey: 'issuer',
            cell: (props) => (
                <span className="text-sm text-gray-500">
                    {props.row.original.issuer}
                </span>
            ),
        },
        {
            header: 'Válido desde',
            accessorKey: 'validFrom',
            cell: (props) => (
                <span className="text-sm">
                    {formatDate(props.row.original.validFrom)}
                </span>
            ),
        },
        {
            header: 'Válido hasta',
            accessorKey: 'validTo',
            cell: (props) => {
                const expired = isExpired(props.row.original.validTo)
                return (
                    <span
                        className={`inline-flex items-center gap-1 text-sm font-medium ${
                            expired ? 'text-red-500' : 'text-green-600'
                        }`}
                    >
                        <span
                            className={`w-2 h-2 rounded-full ${
                                expired ? 'bg-red-500' : 'bg-green-500'
                            }`}
                        />
                        {formatDate(props.row.original.validTo)}
                    </span>
                )
            },
        },
        {
            header: 'Acciones',
            id: 'actions',
            cell: (props) => (
                <Button
                    size="sm"
                    variant="plain"
                    icon={<HiOutlineTrash />}
                    onClick={() => onDelete(props.row.original)}
                />
            ),
        },
    ]

    return (
        <DataTable
            columns={columns}
            data={certificates}
            loading={isLoading}
            pagingData={{
                total: certificates.length,
                pageIndex: 1,
                pageSize: certificates.length || 10,
            }}
        />
    )
}

export default CertificatesTable
