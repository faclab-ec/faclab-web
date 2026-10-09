import { useState } from 'react'
import Card from '@/components/ui/Card'
import Tabs from '@/components/ui/Tabs'
import { useWarehousesList } from '@features/warehouses'
import ValuationTab from '../components/ValuationTab'
import RotationTab from '../components/RotationTab'
import MovementsTab from '../components/MovementsTab'
import WarehouseSummaryTab from '../components/WarehouseSummaryTab'

const { TabList, TabNav, TabContent } = Tabs

const ReportsPage = () => {
    const [activeTab, setActiveTab] = useState('valuation')

    const { data: warehousesData } = useWarehousesList({ limit: 100 })
    const warehouses = warehousesData?.items ?? []
    const warehouseOptions = [
        { value: '', label: 'Todos los almacenes' },
        ...warehouses.map((w) => ({
            value: w.id.toString(),
            label: `${w.name} (${w.code})`,
        })),
    ]

    return (
        <div className="flex flex-col gap-4">
            <Card>
                <Tabs value={activeTab} onChange={setActiveTab}>
                    <TabList>
                        <TabNav value="valuation">Valorización</TabNav>
                        <TabNav value="rotation">Rotación</TabNav>
                        <TabNav value="movements">Movimientos</TabNav>
                        <TabNav value="summary">Resumen por Almacén</TabNav>
                    </TabList>

                    <div className="mt-4">
                        <TabContent value="valuation">
                            <ValuationTab warehouseOptions={warehouseOptions} />
                        </TabContent>

                        <TabContent value="rotation">
                            <RotationTab warehouseOptions={warehouseOptions} />
                        </TabContent>

                        <TabContent value="movements">
                            <MovementsTab warehouseOptions={warehouseOptions} />
                        </TabContent>

                        <TabContent value="summary">
                            <WarehouseSummaryTab
                                warehouseOptions={warehouseOptions}
                            />
                        </TabContent>
                    </div>
                </Tabs>
            </Card>
        </div>
    )
}

export default ReportsPage
