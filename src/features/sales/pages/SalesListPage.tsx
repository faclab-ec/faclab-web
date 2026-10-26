import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import DataTable, { ColumnDef } from '@/components/shared/DataTable'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import StatusBadge from '@/components/shared/StatusBadge'
import Select from '@/components/ui/Select'
import { CustomerSelect } from '@features/customers'
import { formatCurrency } from '@shared/lib/format'
import { useSalesList } from '../hooks/useSales'
import {
    SALE_STATUS_LABELS,
    SALE_STATUS_TONES,
    PAYMENT_STATUS_LABELS,
    PAYMENT_STATUS_TONES,
    type Sale,
    type SaleQueryParams,
    type SaleStatus,
} from '../model/types'
import { HiOutlineEye } from 'react-icons/hi'
import LabeledField from '@/components/shared/LabeledField'
import PageHeader from '@/components/shared/PageHeader'

const statusOptions = [
    { value: '', label: 'Todos' },
    ...Object.entries(SALE_STATUS_LABELS).map(([value, label]) => ({
        value,
        label,
    })),
]

const SalesListPage = () => {
    const navigate = useNavigate()
    // Links can open the list filtered, e.g. ?status=CONFIRMED (not invoiced yet)
    const [searchParams] = useSearchParams()

    const [statusFilter, setStatusFilter] = useState<string>(
        searchParams.get('status') ?? ''
    )
    const [customerFilter, setCustomerFilter] = useState<number | null>(null)
    const [pageIndex, setPageIndex] = useState(1)
    const [pageSize, setPageSize] = useState(10)
    const offset = (pageIndex - 1) * pageSize

    const queryParams: SaleQueryParams = {
        status: statusFilter ? (statusFilter as SaleStatus) : undefined,
        customerId: customerFilter ?? undefined,
        limit: pageSize,
        offset,
    }

    const {
        data,
        isLoading,
        error: listError,
        refetch,
    } = useSalesList(queryParams)
    const sales = data?.items ?? []
    const total = data?.pagination?.total ?? 0

    const handleReset = () => {
        setStatusFilter('')
        setCustomerFilter(null)
        setPageIndex(1)
    }

    const columns: ColumnDef<Sale>[] = [
        {
            header: 'Número',
            accessorKey: 'number',
            cell: (props) => (
                <span className="font-medium">
                    {props.row.original.number ?? `#${props.row.original.id}`}
                </span>
            ),
        },
        {
            header: 'Cliente',
            accessorKey: 'customerName',
            cell: (props) =>
                props.row.original.customerName ?? 'Consumidor final',
        },
        {
            header: 'Estado',
            accessorKey: 'status',
            cell: (props) => {
                const status = props.row.original.status
                return (
                    <StatusBadge tone={SALE_STATUS_TONES[status]}>
                        {SALE_STATUS_LABELS[status]}
                    </StatusBadge>
                )
            },
        },
        {
            header: 'Pago',
            accessorKey: 'paymentStatus',
            cell: (props) => {
                const ps = props.row.original.paymentStatus
                return (
                    <StatusBadge tone={PAYMENT_STATUS_TONES[ps]}>
                        {PAYMENT_STATUS_LABELS[ps]}
                    </StatusBadge>
                )
            },
        },
        {
            header: 'Total',
            accessorKey: 'total',
            cell: (props) => (
                <span className="font-medium">
                    {formatCurrency(props.row.original.total)}
                </span>
            ),
        },
        {
            header: 'Fecha de Venta',
            accessorKey: 'saleDate',
            cell: (props) => {
                const date = props.row.original.saleDate
                return (
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                        {date
                            ? new Date(date).toLocaleDateString('es-EC')
                            : '-'}
                    </span>
                )
            },
        },
        {
            header: 'Creado por',
            accessorKey: 'createdBy',
            cell: (props) => (
                <span className="text-sm text-gray-600 dark:text-gray-400">
                    {props.row.original.createdBy ?? '-'}
                </span>
            ),
        },
        {
            header: 'Acciones',
            id: 'actions',
            cell: (props) => (
                <Button
                    size="sm"
                    variant="plain"
                    aria-label="Ver detalle"
                    icon={<HiOutlineEye />}
                    onClick={() => navigate(`/sales/${props.row.original.id}`)}
                />
            ),
        },
    ]

    return (
        <>
            <PageHeader
                title="Ventas"
                description="Consulta el historial de ventas"
            />
            <Card className="mb-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <LabeledField label="Estado">
                        <Select
                            placeholder="Filtrar por estado"
                            options={statusOptions}
                            value={statusOptions.find(
                                (o) => o.value === statusFilter
                            )}
                            onChange={(option) => {
                                setStatusFilter(option?.value || '')
                                setPageIndex(1)
                            }}
                        />
                    </LabeledField>
                    <LabeledField label="Cliente">
                        <CustomerSelect
                            isClearable
                            placeholder="Todos"
                            value={customerFilter}
                            onChange={(id) => {
                                setCustomerFilter(id)
                                setPageIndex(1)
                            }}
                        />
                    </LabeledField>
                    <div className="flex items-end">
                        <Button variant="plain" onClick={handleReset}>
                            Limpiar Filtros
                        </Button>
                    </div>
                </div>
            </Card>

            <Card bodyClass="p-0">
                <DataTable
                    columns={columns}
                    data={sales}
                    loading={isLoading}
                    error={listError}
                    pagingData={{ total, pageIndex, pageSize }}
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

export default SalesListPage
