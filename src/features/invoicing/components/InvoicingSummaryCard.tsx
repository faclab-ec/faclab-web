import { useNavigate } from 'react-router-dom'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { useCan } from '@/stores'
import { useInvoicingStatus } from '../hooks/useInvoicing'
import InvoicingChecklist from './InvoicingChecklist'

interface InvoicingSummaryCardProps {
    // CONFIRMED sales in faclab-core: their invoice isn't authorized yet
    uninvoicedSales?: number
}

/** Home page card: is invoicing ready, and how many invoices are in flight */
const InvoicingSummaryCard = ({
    uninvoicedSales,
}: InvoicingSummaryCardProps) => {
    const navigate = useNavigate()
    const canConfigure = useCan('user:manage')
    const { data: status } = useInvoicingStatus()
    if (!status) return null

    return (
        <Card>
            <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                    <h5>Facturación electrónica</h5>
                    <Badge
                        content={status.ready ? 'Lista' : 'No está lista'}
                        className={
                            status.ready
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300'
                                : 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300'
                        }
                    />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                        <InvoicingChecklist status={status} />
                        {canConfigure && !status.ready && (
                            <Button
                                size="sm"
                                variant="solid"
                                className="mt-4"
                                onClick={() =>
                                    navigate('/settings/company-config')
                                }
                            >
                                Completar configuración
                            </Button>
                        )}
                    </div>
                    <div className="grid grid-cols-3 gap-3 self-start">
                        <div className="border rounded-lg p-3 border-gray-200 dark:border-gray-600">
                            <p className="text-xs text-gray-500">
                                Facturas en proceso
                            </p>
                            <p className="text-2xl font-bold mt-1">
                                {status.pendingInvoices}
                            </p>
                        </div>
                        <button
                            className="border rounded-lg p-3 text-left border-gray-200 dark:border-gray-600 hover:shadow-md transition-all"
                            onClick={() => navigate('/invoices?attention=1')}
                        >
                            <p className="text-xs text-gray-500">
                                Requieren atención
                            </p>
                            <p
                                className={`text-2xl font-bold mt-1 ${
                                    status.invoicesWithIssues > 0
                                        ? 'text-amber-600 dark:text-amber-400'
                                        : ''
                                }`}
                            >
                                {status.invoicesWithIssues}
                            </p>
                        </button>
                        {uninvoicedSales !== undefined && (
                            <button
                                className="border rounded-lg p-3 text-left border-gray-200 dark:border-gray-600 hover:shadow-md transition-all"
                                onClick={() =>
                                    navigate('/sales?status=CONFIRMED')
                                }
                            >
                                <p className="text-xs text-gray-500">
                                    Ventas sin factura autorizada
                                </p>
                                <p className="text-2xl font-bold mt-1">
                                    {uninvoicedSales}
                                </p>
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </Card>
    )
}

export default InvoicingSummaryCard
