import { useNavigate } from 'react-router-dom'
import Card from '@/components/ui/Card'
import Table from '@/components/ui/Table'
import Spinner from '@/components/ui/Spinner'
import { useDashboard } from '@features/reports'
import { InvoicingSummaryCard } from '@features/invoicing'

const { THead, TBody, Th, Tr, Td } = Table

const formatCurrency = (value: number) =>
    new Intl.NumberFormat('es-EC', {
        style: 'currency',
        currency: 'USD',
    }).format(value)

const HomePage = () => {
    const navigate = useNavigate()

    // One call: inventory value, warehouse summary and alert counts
    const { data: dashboard, isLoading } = useDashboard(30)
    const warehouseSummary = dashboard?.warehouses ?? []
    const alerts = dashboard?.alerts ?? {
        lowStock: 0,
        outOfStock: 0,
        reorderPoint: 0,
        expiringSoon: 0,
    }

    const totalAlerts =
        alerts.lowStock +
        alerts.outOfStock +
        alerts.reorderPoint +
        alerts.expiringSoon

    const alertSummary = [
        {
            tab: 'low_stock',
            label: 'Stock Bajo',
            count: alerts.lowStock,
            colorClass:
                'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20',
            textClass: 'text-amber-700 dark:text-amber-300',
            countClass: 'text-amber-600 dark:text-amber-400',
        },
        {
            tab: 'out_of_stock',
            label: 'Sin Stock',
            count: alerts.outOfStock,
            colorClass:
                'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20',
            textClass: 'text-red-700 dark:text-red-300',
            countClass: 'text-red-600 dark:text-red-400',
        },
        {
            tab: 'reorder_point',
            label: 'Punto de Reorden',
            count: alerts.reorderPoint,
            colorClass:
                'bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20',
            textClass: 'text-blue-700 dark:text-blue-300',
            countClass: 'text-blue-600 dark:text-blue-400',
        },
        {
            tab: 'expiring_soon',
            label: 'Por Vencer',
            count: alerts.expiringSoon,
            colorClass:
                'bg-orange-50 dark:bg-orange-500/10 border-orange-200 dark:border-orange-500/20',
            textClass: 'text-orange-700 dark:text-orange-300',
            countClass: 'text-orange-600 dark:text-orange-400',
        },
    ]

    return (
        <div className="flex flex-col gap-6">
            <h3>Dashboard</h3>

            <InvoicingSummaryCard
                uninvoicedSales={dashboard?.uninvoicedSales}
            />

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <div className="p-4">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Valor del Inventario
                        </p>
                        {isLoading ? (
                            <Spinner size={20} className="mt-2" />
                        ) : (
                            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                                {formatCurrency(dashboard?.inventoryValue ?? 0)}
                            </p>
                        )}
                    </div>
                </Card>
                <Card>
                    <div className="p-4">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Almacenes
                        </p>
                        {isLoading ? (
                            <Spinner size={20} className="mt-2" />
                        ) : (
                            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                                {warehouseSummary.length}
                            </p>
                        )}
                    </div>
                </Card>
                <button
                    className="text-left"
                    onClick={() => navigate('/alerts')}
                >
                    <Card>
                        <div className="p-4">
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Alertas Activas
                            </p>
                            <p
                                className={`text-2xl font-bold mt-1 ${
                                    totalAlerts > 0
                                        ? 'text-red-600 dark:text-red-400'
                                        : 'text-gray-600 dark:text-gray-400'
                                }`}
                            >
                                {totalAlerts}
                            </p>
                        </div>
                    </Card>
                </button>
                <button
                    className="text-left"
                    onClick={() =>
                        navigate('/alerts', {
                            state: { tab: 'expiring_soon' },
                        })
                    }
                >
                    <Card>
                        <div className="p-4">
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Lotes por Vencer
                            </p>
                            <p
                                className={`text-2xl font-bold mt-1 ${
                                    alerts.expiringSoon > 0
                                        ? 'text-orange-600 dark:text-orange-400'
                                        : 'text-gray-600 dark:text-gray-400'
                                }`}
                            >
                                {alerts.expiringSoon}
                            </p>
                        </div>
                    </Card>
                </button>
            </div>

            <Card>
                <div className="p-4">
                    <div className="flex items-center justify-between mb-4">
                        <h5>Alertas de Inventario</h5>
                        <button
                            className="text-sm text-primary hover:underline"
                            onClick={() => navigate('/alerts')}
                        >
                            Ver todo
                        </button>
                    </div>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                        {alertSummary.map((item) => (
                            <button
                                key={item.tab}
                                className={`border rounded-lg p-3 text-left cursor-pointer transition-all hover:shadow-md ${item.colorClass}`}
                                onClick={() =>
                                    navigate('/alerts', {
                                        state: { tab: item.tab },
                                    })
                                }
                            >
                                <p
                                    className={`text-xs font-medium ${item.textClass}`}
                                >
                                    {item.label}
                                </p>
                                <p
                                    className={`text-2xl font-bold mt-1 ${item.countClass}`}
                                >
                                    {item.count}
                                </p>
                            </button>
                        ))}
                    </div>
                </div>
            </Card>

            <Card>
                <div className="p-4">
                    <h5 className="mb-4">Resumen por Almacen</h5>
                    {isLoading ? (
                        <div className="flex justify-center py-8">
                            <Spinner size={30} />
                        </div>
                    ) : warehouseSummary.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            No hay datos de almacenes
                        </div>
                    ) : (
                        <Table>
                            <THead>
                                <Tr>
                                    <Th>Almacen</Th>
                                    <Th>Codigo</Th>
                                    <Th>Productos</Th>
                                    <Th>Cantidad Total</Th>
                                    <Th>Disponible</Th>
                                    <Th>Valor Total</Th>
                                </Tr>
                            </THead>
                            <TBody>
                                {warehouseSummary.map((ws) => (
                                    <Tr key={ws.warehouseId}>
                                        <Td>
                                            <span className="font-medium">
                                                {ws.warehouseName}
                                            </span>
                                        </Td>
                                        <Td>
                                            <span className="font-mono text-sm text-gray-600 dark:text-gray-400">
                                                {ws.warehouseCode}
                                            </span>
                                        </Td>
                                        <Td>{ws.totalProducts}</Td>
                                        <Td>{ws.totalQuantity}</Td>
                                        <Td>
                                            <span className="text-emerald-600 dark:text-emerald-400">
                                                {ws.availableQuantity}
                                            </span>
                                        </Td>
                                        <Td>
                                            <span className="font-medium">
                                                {formatCurrency(ws.totalValue)}
                                            </span>
                                        </Td>
                                    </Tr>
                                ))}
                            </TBody>
                        </Table>
                    )}
                </div>
            </Card>
        </div>
    )
}

export default HomePage
