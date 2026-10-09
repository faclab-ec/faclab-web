import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import DataTable, { ColumnDef } from '@/components/shared/DataTable'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Select from '@/components/ui/Select'
import { usePurchaseOrders } from '../hooks/usePurchaseOrders'
import { SupplierSelect } from '@features/suppliers'
import { formatCurrency } from '@shared/lib/format'
import {
    PURCHASE_ORDER_STATUS_LABELS,
    PURCHASE_ORDER_STATUS_CLASSES,
    type PurchaseOrder,
    type PurchaseOrderQueryParams,
    type PurchaseOrderStatus,
} from '../model/types'
import PurchaseOrderForm from '../components/PurchaseOrderForm'
import { HiPlus, HiOutlineEye } from 'react-icons/hi'

const statusOptions = [
    { value: '', label: 'Todos' },
    ...Object.entries(PURCHASE_ORDER_STATUS_LABELS).map(([value, label]) => ({
        value,
        label,
    })),
]

const PurchaseOrdersListPage = () => {
    const navigate = useNavigate()
    const [isFormOpen, setIsFormOpen] = useState(false)

    const [statusFilter, setStatusFilter] = useState<string>('')
    const [supplierFilter, setSupplierFilter] = useState<number | null>(null)
    const [pageIndex, setPageIndex] = useState(1)
    const [pageSize, setPageSize] = useState(10)
    const offset = (pageIndex - 1) * pageSize

    const queryParams: PurchaseOrderQueryParams = {
        status: statusFilter
            ? (statusFilter as PurchaseOrderStatus)
            : undefined,
        supplierId: supplierFilter ?? undefined,
        limit: pageSize,
        offset,
    }

    const { data, isLoading } = usePurchaseOrders(queryParams)
    const orders = data?.items ?? []
    const total = data?.pagination?.total ?? 0

    const handleReset = () => {
        setStatusFilter('')
        setSupplierFilter(null)
        setPageIndex(1)
    }

    const handleCreated = (id: number) => {
        navigate(`/purchase-orders/${id}`)
    }

    const columns: ColumnDef<PurchaseOrder>[] = [
        {
            header: 'Número',
            accessorKey: 'orderNumber',
            cell: (props) => (
                <span className="font-medium">
                    {props.row.original.orderNumber}
                </span>
            ),
        },
        {
            header: 'Proveedor',
            accessorKey: 'supplierName',
            cell: (props) =>
                props.row.original.supplierName ??
                `#${props.row.original.supplierId}`,
        },
        {
            header: 'Estado',
            accessorKey: 'status',
            cell: (props) => {
                const status = props.row.original.status
                return (
                    <Badge
                        content={PURCHASE_ORDER_STATUS_LABELS[status]}
                        className={PURCHASE_ORDER_STATUS_CLASSES[status]}
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
            header: 'Fecha Esperada',
            accessorKey: 'expectedDate',
            cell: (props) => {
                const date = props.row.original.expectedDate
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
            header: 'Fecha Creación',
            accessorKey: 'createdAt',
            cell: (props) => {
                const date = props.row.original.createdAt
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
            header: 'Acciones',
            id: 'actions',
            cell: (props) => (
                <Button
                    size="sm"
                    variant="plain"
                    icon={<HiOutlineEye />}
                    onClick={() =>
                        navigate(`/purchase-orders/${props.row.original.id}`)
                    }
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
                                Proveedor
                            </label>
                            <SupplierSelect
                                isClearable
                                placeholder="Todos"
                                value={supplierFilter}
                                onChange={(id) => {
                                    setSupplierFilter(id)
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
                    <div className="flex justify-between items-center mb-4">
                        <div>
                            <h4 className="text-lg font-semibold">
                                Órdenes de Compra
                            </h4>
                            <p className="text-sm text-gray-500 mt-1">
                                Gestiona las órdenes de compra a proveedores
                            </p>
                        </div>
                        <Button
                            variant="solid"
                            size="sm"
                            icon={<HiPlus />}
                            onClick={() => setIsFormOpen(true)}
                        >
                            Nueva Orden de Compra
                        </Button>
                    </div>

                    <DataTable
                        columns={columns}
                        data={orders}
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

            <PurchaseOrderForm
                open={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                onCreated={handleCreated}
            />
        </>
    )
}

export default PurchaseOrdersListPage
