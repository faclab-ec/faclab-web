import { useParams, useNavigate } from 'react-router-dom'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Tabs from '@/components/ui/Tabs'
import { HiOutlineArrowLeft } from 'react-icons/hi'
import { useProductsList } from '@features/products'
import { useSale } from '../hooks/useSales'
import {
    SALE_STATUS_LABELS,
    SALE_STATUS_CLASSES,
    PAYMENT_STATUS_LABELS,
    PAYMENT_STATUS_CLASSES,
} from '../model/types'
import SaleInfoCard from '../components/SaleInfoCard'
import SaleItemsTab from '../components/SaleItemsTab'
import SalePaymentsTab from '../components/SalePaymentsTab'
import SaleInvoicesTab from '../components/SaleInvoicesTab'

const { TabList, TabNav, TabContent } = Tabs

const SaleDetailPage = () => {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const saleId = parseInt(id || '0')

    const { data: sale, isLoading } = useSale(saleId)
    const { data: productsData } = useProductsList()
    const products = productsData?.items ?? []

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-96">
                <div>Cargando...</div>
            </div>
        )
    }

    if (!sale) {
        return (
            <div className="flex flex-col items-center justify-center h-96">
                <h4 className="mb-4">Venta no encontrada</h4>
                <Button
                    variant="solid"
                    icon={<HiOutlineArrowLeft />}
                    onClick={() => navigate('/sales')}
                >
                    Volver a Ventas
                </Button>
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4">
                <Button
                    variant="plain"
                    icon={<HiOutlineArrowLeft />}
                    onClick={() => navigate('/sales')}
                />
                <h3>Venta #{sale.id}</h3>
                <Badge
                    content={SALE_STATUS_LABELS[sale.status]}
                    className={SALE_STATUS_CLASSES[sale.status]}
                />
                <Badge
                    content={PAYMENT_STATUS_LABELS[sale.paymentStatus]}
                    className={PAYMENT_STATUS_CLASSES[sale.paymentStatus]}
                />
            </div>

            <SaleInfoCard sale={sale} />

            <Card>
                <Tabs defaultValue="items">
                    <TabList>
                        <TabNav value="items">Items</TabNav>
                        <TabNav value="payments">Pagos</TabNav>
                        <TabNav value="invoices">Facturas</TabNav>
                    </TabList>
                    <div className="mt-4">
                        <TabContent value="items">
                            <SaleItemsTab saleId={saleId} products={products} />
                        </TabContent>
                        <TabContent value="payments">
                            <SalePaymentsTab
                                saleId={saleId}
                                saleTotal={sale.total}
                            />
                        </TabContent>
                        <TabContent value="invoices">
                            <SaleInvoicesTab saleId={saleId} />
                        </TabContent>
                    </div>
                </Tabs>
            </Card>
        </div>
    )
}

export default SaleDetailPage
