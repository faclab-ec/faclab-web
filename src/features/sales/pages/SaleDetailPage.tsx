import { useParams, useNavigate } from 'react-router-dom'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import StatusBadge from '@/components/shared/StatusBadge'
import Tabs from '@/components/ui/Tabs'
import { HiOutlineArrowLeft } from 'react-icons/hi'
import { useSale } from '../hooks/useSales'
import {
    SALE_STATUS_LABELS,
    SALE_STATUS_TONES,
    PAYMENT_STATUS_LABELS,
    PAYMENT_STATUS_TONES,
} from '../model/types'
import SaleInfoCard from '../components/SaleInfoCard'
import SaleItemsTab from '../components/SaleItemsTab'
import SalePaymentsTab from '../components/SalePaymentsTab'
import SaleInvoicesTab from '../components/SaleInvoicesTab'
import PageHeader from '@/components/shared/PageHeader'
import EmptyState from '@/components/shared/EmptyState'

const { TabList, TabNav, TabContent } = Tabs

const SaleDetailPage = () => {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const saleId = parseInt(id || '0')

    const { data: sale, isLoading } = useSale(saleId)

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-96">
                <div>Cargando...</div>
            </div>
        )
    }

    if (!sale) {
        return (
            <EmptyState
                className="min-h-[24rem]"
                title="Venta no encontrada"
                action={
                    <Button
                        size="sm"
                        icon={<HiOutlineArrowLeft />}
                        onClick={() => navigate('/sales')}
                    >
                        Volver a Ventas
                    </Button>
                }
            />
        )
    }

    return (
        <div className="flex flex-col gap-4">
            <PageHeader
                className="!mb-1"
                title={`Venta #${sale.id}`}
                badge={
                    <>
                        <StatusBadge tone={SALE_STATUS_TONES[sale.status]}>
                            {SALE_STATUS_LABELS[sale.status]}
                        </StatusBadge>
                        <StatusBadge
                            tone={PAYMENT_STATUS_TONES[sale.paymentStatus]}
                        >
                            {PAYMENT_STATUS_LABELS[sale.paymentStatus]}
                        </StatusBadge>
                    </>
                }
                onBack={() => navigate('/sales')}
            />

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
                            <SaleItemsTab saleId={saleId} />
                        </TabContent>
                        <TabContent value="payments">
                            <SalePaymentsTab
                                saleId={saleId}
                                saleTotal={sale.total}
                            />
                        </TabContent>
                        <TabContent value="invoices">
                            <SaleInvoicesTab
                                saleId={saleId}
                                saleStatus={sale.status}
                            />
                        </TabContent>
                    </div>
                </Tabs>
            </Card>
        </div>
    )
}

export default SaleDetailPage
