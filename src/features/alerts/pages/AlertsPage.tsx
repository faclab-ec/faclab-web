import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import Card from '@/components/ui/Card'
import Select from '@/components/ui/Select'
import Tabs from '@/components/ui/Tabs'
import {
    useLowStock,
    useOutOfStock,
    useReorderPoint,
    useExpiringLots,
} from '../hooks/useAlerts'
import { useWarehousesList } from '@features/warehouses'
import AlertSummaryCards from '../components/AlertSummaryCards'
import StockAlertTab from '../components/StockAlertTab'
import ExpiringLotsTab from '../components/ExpiringLotsTab'

const { TabList, TabNav, TabContent } = Tabs

const AlertsPage = () => {
    const location = useLocation()
    const initialTab =
        (location.state as { tab?: string } | null)?.tab ?? 'low_stock'
    const [activeTab, setActiveTab] = useState(initialTab)
    const [warehouseFilter, setWarehouseFilter] = useState<string>('')
    const [expiringDays, setExpiringDays] = useState<string>('30')

    const warehouseId = warehouseFilter ? parseInt(warehouseFilter) : undefined
    const days = expiringDays ? parseInt(expiringDays) : 30

    const { data: warehousesData } = useWarehousesList({ limit: 100 })
    const warehouses = warehousesData?.items ?? []

    const warehouseOptions = [
        { value: '', label: 'Todos los almacenes' },
        ...warehouses.map((w) => ({
            value: w.id.toString(),
            label: `${w.name} (${w.code})`,
        })),
    ]

    const { data: lowStock = [], isLoading: loadingLowStock } = useLowStock(
        warehouseId ? { warehouseId } : undefined
    )
    const { data: outOfStock = [], isLoading: loadingOutOfStock } =
        useOutOfStock(warehouseId ? { warehouseId } : undefined)
    const { data: reorderPoint = [], isLoading: loadingReorderPoint } =
        useReorderPoint(warehouseId ? { warehouseId } : undefined)
    const { data: expiringLots = [], isLoading: loadingExpiring } =
        useExpiringLots({ days })

    const getWarehouseName = (warehouseId: number | null) => {
        if (!warehouseId) return '-'
        const w = warehouses.find((w) => w.id === warehouseId)
        return w ? w.name : `#${warehouseId}`
    }

    return (
        <div className="flex flex-col gap-4">
            <AlertSummaryCards
                counts={{
                    lowStock: lowStock.length,
                    outOfStock: outOfStock.length,
                    reorderPoint: reorderPoint.length,
                    expiringLots: expiringLots.length,
                }}
                activeTab={activeTab}
                onSelect={setActiveTab}
            />

            <Card>
                <div className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {activeTab !== 'expiring_soon' ? (
                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Almacén
                                </label>
                                <Select
                                    placeholder="Filtrar por almacén"
                                    options={warehouseOptions}
                                    value={warehouseOptions.find(
                                        (o) => o.value === warehouseFilter
                                    )}
                                    onChange={(option) =>
                                        setWarehouseFilter(option?.value || '')
                                    }
                                />
                            </div>
                        ) : (
                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Días para vencer
                                </label>
                                <input
                                    type="number"
                                    min={1}
                                    className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100"
                                    value={expiringDays}
                                    onChange={(e) =>
                                        setExpiringDays(e.target.value)
                                    }
                                />
                            </div>
                        )}
                    </div>
                </div>
            </Card>

            <Card>
                <Tabs value={activeTab} onChange={setActiveTab}>
                    <TabList>
                        <TabNav value="low_stock">
                            Stock Bajo ({lowStock.length})
                        </TabNav>
                        <TabNav value="out_of_stock">
                            Sin Stock ({outOfStock.length})
                        </TabNav>
                        <TabNav value="reorder_point">
                            Punto de Reorden ({reorderPoint.length})
                        </TabNav>
                        <TabNav value="expiring_soon">
                            Por Vencer ({expiringLots.length})
                        </TabNav>
                    </TabList>

                    <div className="mt-4">
                        <TabContent value="low_stock">
                            <StockAlertTab
                                data={lowStock}
                                loading={loadingLowStock}
                                emptyMessage="Sin alertas de stock bajo"
                                getWarehouseName={getWarehouseName}
                            />
                        </TabContent>

                        <TabContent value="out_of_stock">
                            <StockAlertTab
                                data={outOfStock}
                                loading={loadingOutOfStock}
                                emptyMessage="Sin productos sin stock"
                                getWarehouseName={getWarehouseName}
                            />
                        </TabContent>

                        <TabContent value="reorder_point">
                            <StockAlertTab
                                data={reorderPoint}
                                loading={loadingReorderPoint}
                                emptyMessage="Sin alertas de punto de reorden"
                                getWarehouseName={getWarehouseName}
                            />
                        </TabContent>

                        <TabContent value="expiring_soon">
                            <ExpiringLotsTab
                                data={expiringLots}
                                loading={loadingExpiring}
                            />
                        </TabContent>
                    </div>
                </Tabs>
            </Card>
        </div>
    )
}

export default AlertsPage
