import { useState } from 'react'
import { useStockList } from '../hooks/useStock'
import DataTable, { ColumnDef } from '@/components/shared/DataTable'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import type { Stock } from '../model/types'

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

    const { data, isLoading } = useStockList(queryParams)
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
                <div className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">
                                ID Producto
                            </label>
                            <Input
                                type="number"
                                placeholder="Filtrar por producto"
                                value={productId}
                                onChange={(e) => setProductId(e.target.value)}
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
                            <h4 className="text-lg font-semibold">Stock</h4>
                            <p className="text-sm text-gray-500 mt-1">
                                Consulta el stock disponible por producto
                            </p>
                        </div>
                    </div>

                    <DataTable
                        columns={columns}
                        data={stock}
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

export default StockPage
