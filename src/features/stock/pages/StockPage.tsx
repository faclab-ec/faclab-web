import { useState } from 'react'
import { useStockList } from '../hooks/useStock'
import DataTable, { ColumnDef } from '@/components/shared/DataTable'
import Card from '@/components/ui/Card'
import PageHeader from '@/components/shared/PageHeader'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import type { Stock } from '../model/types'
import LabeledField from '@/components/shared/LabeledField'

const StockPage = () => {
    const [productId, setProductId] = useState<string>('')

    const [pageIndex, setPageIndex] = useState(1)
    const [pageSize, setPageSize] = useState(10)
    const offset = (pageIndex - 1) * pageSize

    const queryParams = {
        productId: productId ? parseInt(productId) : undefined,
        limit: pageSize,
        offset,
    }

    const {
        data,
        isLoading,
        error: listError,
        refetch,
    } = useStockList(queryParams)
    const stock = data?.items ?? []
    const total = data?.pagination?.total ?? 0

    const columns: ColumnDef<Stock>[] = [
        {
            header: 'ID',
            accessorKey: 'id',
            cell: (props) => (
                <span className="font-medium">#{props.row.original.id}</span>
            ),
        },
        {
            header: 'Producto',
            accessorKey: 'productName',
            cell: ({ row }) =>
                row.original.productName ?? `#${row.original.productId}`,
        },
        {
            header: 'Cantidad',
            accessorKey: 'quantity',
            cell: ({ row }) => {
                const quantity = row.original.quantity
                return (
                    <span
                        className={
                            quantity < 50
                                ? 'text-red-600 font-semibold'
                                : quantity < 100
                                ? 'text-yellow-600 font-semibold'
                                : 'text-green-600 font-semibold'
                        }
                    >
                        {quantity}
                    </span>
                )
            },
        },
        {
            header: 'Ubicación',
            accessorKey: 'locationName',
            cell: ({ row }) =>
                row.original.locationName || (
                    <span className="text-gray-400 italic">Sin ubicación</span>
                ),
        },
    ]

    const handleReset = () => {
        setProductId('')
        setPageIndex(1)
    }

    return (
        <>
            <Card className="mb-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <LabeledField label="ID Producto">
                        <Input
                            type="number"
                            placeholder="Filtrar por producto"
                            value={productId}
                            onChange={(e) => setProductId(e.target.value)}
                        />
                    </LabeledField>
                    <div className="flex items-end">
                        <Button variant="plain" onClick={handleReset}>
                            Limpiar Filtros
                        </Button>
                    </div>
                </div>
            </Card>

            <PageHeader
                title="Stock"
                description="Consulta el stock disponible por producto"
            />
            <Card bodyClass="p-0">
                <DataTable
                    columns={columns}
                    data={stock}
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

export default StockPage
