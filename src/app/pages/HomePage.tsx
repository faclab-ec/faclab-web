import { useNavigate } from 'react-router-dom'
import {
    HiOutlineBan,
    HiOutlineBell,
    HiOutlineClock,
    HiOutlineCurrencyDollar,
    HiOutlineOfficeBuilding,
    HiOutlineRefresh,
    HiOutlineTrendingDown,
} from 'react-icons/hi'
import Card from '@/components/ui/Card'
import Table from '@/components/ui/Table'
import Skeleton from '@/components/ui/Skeleton'
import {
    BarList,
    EmptyState,
    ErrorState,
    PageHeader,
    StatCard,
} from '@/components/shared'
import { formatCurrency, formatPercent } from '@shared/lib/format'
import { useDashboard } from '@features/reports'
import { InvoicingSummaryCard } from '@features/invoicing'
import type { ReactNode } from 'react'
import type { StatusTone } from '@shared/lib/statusTone'

const { THead, TBody, Th, Tr, Td } = Table

interface AlertTile {
    tab: string
    label: string
    count: number
    tone: StatusTone
    icon: ReactNode
}

const HomePage = () => {
    const navigate = useNavigate()

    // One call: inventory value, warehouse summary and alert counts
    const { data: dashboard, isLoading, error, refetch } = useDashboard(30)
    const warehouses = dashboard?.warehouses ?? []
    const alerts = dashboard?.alerts ?? {
        lowStock: 0,
        outOfStock: 0,
        reorderPoint: 0,
        expiringSoon: 0,
    }
    const inventoryValue = dashboard?.inventoryValue ?? 0

    const totalAlerts =
        alerts.lowStock +
        alerts.outOfStock +
        alerts.reorderPoint +
        alerts.expiringSoon

    const alertTiles: AlertTile[] = [
        {
            tab: 'low_stock',
            label: 'Stock bajo',
            count: alerts.lowStock,
            tone: 'warning',
            icon: <HiOutlineTrendingDown />,
        },
        {
            tab: 'out_of_stock',
            label: 'Sin stock',
            count: alerts.outOfStock,
            tone: 'danger',
            icon: <HiOutlineBan />,
        },
        {
            tab: 'reorder_point',
            label: 'Punto de reorden',
            count: alerts.reorderPoint,
            tone: 'info',
            icon: <HiOutlineRefresh />,
        },
        {
            tab: 'expiring_soon',
            label: 'Por vencer',
            count: alerts.expiringSoon,
            tone: 'warning',
            icon: <HiOutlineClock />,
        },
    ]

    const openAlerts = (tab?: string) =>
        navigate('/alerts', tab ? { state: { tab } } : undefined)

    if (error) {
        return (
            <>
                <PageHeader title="Resumen" />
                <Card bodyClass="p-0">
                    <ErrorState error={error} onRetry={refetch} />
                </Card>
            </>
        )
    }

    return (
        <>
            <PageHeader
                title="Resumen"
                description="Estado del inventario y de la facturación"
            />

            <div className="flex flex-col gap-5">
                <InvoicingSummaryCard
                    uninvoicedSales={dashboard?.uninvoicedSales}
                />

                <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
                    <StatCard
                        label="Valor del inventario"
                        value={formatCurrency(inventoryValue)}
                        icon={<HiOutlineCurrencyDollar />}
                        tone="success"
                        loading={isLoading}
                    />
                    <StatCard
                        label="Almacenes"
                        value={warehouses.length}
                        icon={<HiOutlineOfficeBuilding />}
                        tone="info"
                        loading={isLoading}
                    />
                    <StatCard
                        label="Alertas activas"
                        value={totalAlerts}
                        icon={<HiOutlineBell />}
                        tone={totalAlerts > 0 ? 'danger' : 'neutral'}
                        loading={isLoading}
                        onClick={() => openAlerts()}
                    />
                    <StatCard
                        label="Lotes por vencer"
                        value={alerts.expiringSoon}
                        hint="Próximos 30 días"
                        icon={<HiOutlineClock />}
                        tone={alerts.expiringSoon > 0 ? 'warning' : 'neutral'}
                        loading={isLoading}
                        onClick={() => openAlerts('expiring_soon')}
                    />
                </div>

                <Card
                    header="Alertas de inventario"
                    headerExtra={
                        <button
                            type="button"
                            className="link text-sm"
                            onClick={() => openAlerts()}
                        >
                            Ver todo
                        </button>
                    }
                >
                    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                        {alertTiles.map((tile) => (
                            <StatCard
                                key={tile.tab}
                                label={tile.label}
                                value={tile.count}
                                icon={tile.icon}
                                tone={tile.count > 0 ? tile.tone : 'neutral'}
                                loading={isLoading}
                                onClick={() => openAlerts(tile.tab)}
                            />
                        ))}
                    </div>
                </Card>

                <div className="grid gap-5 lg:grid-cols-3">
                    <Card header="Valor por almacén">
                        {isLoading ? (
                            <div className="flex flex-col gap-5">
                                <Skeleton height={28} />
                                <Skeleton height={28} />
                            </div>
                        ) : warehouses.length === 0 ? (
                            <EmptyState
                                className="!py-6"
                                title="Sin almacenes"
                                description="Aún no hay inventario valorizado."
                            />
                        ) : (
                            <BarList
                                aria-label="Valor del inventario por almacén"
                                formatValue={formatCurrency}
                                items={[...warehouses]
                                    .sort((a, b) => b.totalValue - a.totalValue)
                                    .map((warehouse) => ({
                                        key: warehouse.warehouseId,
                                        label: warehouse.warehouseName,
                                        value: warehouse.totalValue,
                                        caption:
                                            inventoryValue > 0
                                                ? `${formatPercent(
                                                      (warehouse.totalValue /
                                                          inventoryValue) *
                                                          100
                                                  )} del total`
                                                : undefined,
                                    }))}
                            />
                        )}
                    </Card>

                    <Card
                        className="lg:col-span-2"
                        header="Resumen por almacén"
                        bodyClass="p-0"
                    >
                        {isLoading ? (
                            <div className="flex flex-col gap-4 p-5">
                                <Skeleton />
                                <Skeleton />
                                <Skeleton />
                            </div>
                        ) : warehouses.length === 0 ? (
                            <EmptyState title="No hay datos de almacenes" />
                        ) : (
                            <Table>
                                <THead>
                                    <Tr>
                                        <Th>Almacén</Th>
                                        <Th>Código</Th>
                                        <Th>Productos</Th>
                                        <Th>Cantidad total</Th>
                                        <Th>Disponible</Th>
                                        <Th>Valor total</Th>
                                    </Tr>
                                </THead>
                                <TBody>
                                    {warehouses.map((ws) => (
                                        <Tr key={ws.warehouseId}>
                                            <Td>
                                                <span className="font-medium text-gray-900 dark:text-gray-50">
                                                    {ws.warehouseName}
                                                </span>
                                            </Td>
                                            <Td>
                                                <span className="font-mono text-gray-500 dark:text-gray-400">
                                                    {ws.warehouseCode}
                                                </span>
                                            </Td>
                                            <Td>{ws.totalProducts}</Td>
                                            <Td>{ws.totalQuantity}</Td>
                                            <Td>{ws.availableQuantity}</Td>
                                            <Td>
                                                <span className="font-medium">
                                                    {formatCurrency(
                                                        ws.totalValue
                                                    )}
                                                </span>
                                            </Td>
                                        </Tr>
                                    ))}
                                </TBody>
                            </Table>
                        )}
                    </Card>
                </div>
            </div>
        </>
    )
}

export default HomePage
