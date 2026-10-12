import { useNavigate } from 'react-router-dom'
import Card from '@/components/ui/Card'
import StatusBadge from '@/components/shared/StatusBadge'
import Button from '@/components/ui/Button'
import { useCan } from '@/stores'
import { useInvoicingStatus } from '../hooks/useInvoicing'
import InvoicingChecklist from './InvoicingChecklist'

interface InvoicingSummaryCardProps {
    // CONFIRMED sales in faclab-core: their invoice isn't authorized yet
    uninvoicedSales?: number
}

interface SummaryFigureProps {
    label: string
    value: number
    // Something here needs the user: marked with a dot, not with colored text
    highlight?: boolean
    onClick?: () => void
}

const SummaryFigure = ({
    label,
    value,
    highlight = false,
    onClick,
}: SummaryFigureProps) => {
    const content = (
        <>
            <span className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                {highlight && (
                    <span
                        aria-hidden="true"
                        className="h-1.5 w-1.5 rounded-full bg-amber-500"
                    />
                )}
                {label}
            </span>
            <span className="mt-1 block text-2xl font-semibold tracking-tight text-gray-900 dark:text-gray-50">
                {value}
            </span>
        </>
    )
    const className =
        'block w-full rounded-lg border border-gray-200 p-3 text-left dark:border-gray-700'

    return onClick ? (
        <button
            type="button"
            className={`${className} transition-colors duration-150 hover:border-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/40`}
            onClick={onClick}
        >
            {content}
        </button>
    ) : (
        <div className={className}>{content}</div>
    )
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
        <Card
            header="Facturación electrónica"
            headerExtra={
                <StatusBadge tone={status.ready ? 'success' : 'warning'}>
                    {status.ready ? 'Lista' : 'No está lista'}
                </StatusBadge>
            }
        >
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div>
                    <InvoicingChecklist status={status} />
                    {canConfigure && !status.ready && (
                        <Button
                            size="sm"
                            variant="solid"
                            className="mt-4"
                            onClick={() => navigate('/settings/company-config')}
                        >
                            Completar configuración
                        </Button>
                    )}
                </div>
                <div className="grid grid-cols-1 gap-3 self-start sm:grid-cols-3">
                    <SummaryFigure
                        label="Facturas en proceso"
                        value={status.pendingInvoices}
                    />
                    <SummaryFigure
                        label="Requieren atención"
                        value={status.invoicesWithIssues}
                        highlight={status.invoicesWithIssues > 0}
                        onClick={() => navigate('/invoices?attention=1')}
                    />
                    {uninvoicedSales !== undefined && (
                        <SummaryFigure
                            label="Ventas sin factura autorizada"
                            value={uninvoicedSales}
                            onClick={() => navigate('/sales?status=CONFIRMED')}
                        />
                    )}
                </div>
            </div>
        </Card>
    )
}

export default InvoicingSummaryCard
