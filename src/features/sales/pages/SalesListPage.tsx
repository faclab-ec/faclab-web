import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import DataTable, { ColumnDef } from '@/components/shared/DataTable'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Select from '@/components/ui/Select'
import { CustomerSelect } from '@features/customers'
import { formatCurrency } from '@shared/lib/format'
import { useSalesList } from '../hooks/useSales'
import {
    SALE_STATUS_LABELS,
    SALE_STATUS_CLASSES,
    PAYMENT_STATUS_LABELS,
    PAYMENT_STATUS_CLASSES,
    type Sale,
    type SaleQueryParams,
    type SaleStatus,
} from '../model/types'
import { HiOutlineEye } from 'react-icons/hi'

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

    const { data, isLoading } = useSalesList(queryParams)
    const sales = data?.items ?? []
    const total = data?.pagination?.total ?? 0

    const handleReset = () => {
        setStatusFilter('')
        setCustomerFilter(null)
        setPageIndex(1)
    }

    const columns: ColumnDef<Sale>[] = [
        {
            header: 'ID',
            accessorKey: 'id',
            cell: (props) => (
                <span className="font-medium">#{props.row.original.id}</span>
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
                    <Badge
                        content={SALE_STATUS_LABELS[status]}
                        className={SALE_STATUS_CLASSES[status]}
                    />
                )
            },
        },
        {
            header: 'Pago',
            accessorKey: 'paymentStatus',
            cell: (props) => {
                const ps = props.row.original.paymentStatus
                return (
                    <Badge
                        content={PAYMENT_STATUS_LABELS[ps]}
                        className={PAYMENT_STATUS_CLASSES[ps]}
                    />
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
                    icon={<HiOutlineEye />}
                    onClick={() => navigate(`/sales/${props.row.original.id}`)}
                />
            ),
        },
    ]

    return (
        <>
            <Card className="mb-4">
                <div className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Estado
                            </label>
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
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Cliente
                            </label>
                            <CustomerSelect
                                isClearable
                                placeholder="Todos"
                                value={customerFilter}
                                onChange={(id) => {
                                    setCustomerFilter(id)
                                    setPageIndex(1)
                                }}
                            />
                        </div>
                        <div className="flex items-end">
                            <Button variant="plain" onClick={handleReset}>
                                Limpiar Filtros
                            </Button>
                        </div>
                    </div>
                </div>
            </Card>

            <Card>
                <div className="p-4">
                    <div className="mb-4">
                        <h4 className="text-lg font-semibold">Ventas</h4>
                        <p className="text-sm text-gray-500 mt-1">
                            Consulta el historial de ventas
                        </p>
                    </div>

                    <DataTable
                        columns={columns}
                        data={sales}
                        loading={isLoading}
                        pagingData={{ total, pageIndex, pageSize }}
                        onPaginationChange={setPageIndex}
                        onSelectChange={(size) => {
                            setPageSize(size)
                            setPageIndex(1)
                        }}
                    />
                </div>
            </Card>
        </>
    )
}

export default SalesListPage
