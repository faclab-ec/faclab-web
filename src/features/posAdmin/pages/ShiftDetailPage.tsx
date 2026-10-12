import { useNavigate, useParams } from 'react-router-dom'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import StatusBadge from '@/components/shared/StatusBadge'
import Spinner from '@/components/ui/Spinner'
import {
    HiOutlineArrowLeft,
    HiOutlineCurrencyDollar,
    HiOutlineReceiptRefund,
} from 'react-icons/hi'
import { formatCurrency, formatDatetime } from '@shared/lib/format'
import {
    SHIFT_STATUS_TONES,
    SHIFT_STATUS_LABELS,
    useShift,
    useXReport,
    useZReport,
} from '@features/pos'
import {
    PaymentsByMethodTable,
    ProductsSoldTable,
} from '../components/ReportBlocks'
import StatCard from '@/components/shared/StatCard'
import EmptyState from '@/components/shared/EmptyState'
import PageHeader from '@/components/shared/PageHeader'

const Row = ({ label, value }: { label: string; value: string }) => (
    <div className="flex justify-between py-1">
        <span className="text-gray-500 dark:text-gray-400">{label}</span>
        <span className="font-medium">{value}</span>
    </div>
)

const money = (value: number | null | undefined) =>
    value != null ? formatCurrency(value) : '-'

const ShiftDetailPage = () => {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const shiftId = parseInt(id || '0')

    const { data: shift, isLoading } = useShift(shiftId)
    const isClosed = shift?.status === 'CLOSED'
    // An open shift has its running X report; a closed one, its Z report
    const { data: xReport } = useXReport(shift && !isClosed ? shiftId : 0)
    const { data: zReport } = useZReport(isClosed ? shiftId : 0)
    const report = zReport ?? xReport

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-96">
                <Spinner size={30} />
            </div>
        )
    }

    if (!shift) {
        return (
            <EmptyState
                className="min-h-[24rem]"
                title="Turno no encontrado"
                action={
                    <Button
                        size="sm"
                        icon={<HiOutlineArrowLeft />}
                        onClick={() => navigate('/shifts')}
                    >
                        Volver a Turnos
                    </Button>
                }
            />
        )
    }

    return (
        <div className="flex flex-col gap-4">
            <PageHeader
                className="!mb-1"
                title={`Turno #${shift.id}`}
                badge={
                    <StatusBadge tone={SHIFT_STATUS_TONES[shift.status]}>
                        {SHIFT_STATUS_LABELS[shift.status]}
                    </StatusBadge>
                }
                onBack={() => navigate('/shifts')}
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card>
                    <div className="p-4 text-sm">
                        <h5 className="mb-3">Turno</h5>
                        <Row label="Cajero" value={shift.cashierName} />
                        <Row
                            label="Apertura"
                            value={formatDatetime(shift.openedAt)}
                        />
                        <Row
                            label="Cierre"
                            value={
                                shift.closedAt
                                    ? formatDatetime(shift.closedAt)
                                    : '-'
                            }
                        />
                        {shift.notes && (
                            <Row label="Notas" value={shift.notes} />
                        )}
                    </div>
                </Card>
                <Card>
                    <div className="p-4 text-sm">
                        <h5 className="mb-3">Caja</h5>
                        <Row
                            label="Saldo inicial"
                            value={money(shift.openingBalance)}
                        />
                        {zReport && (
                            <>
                                <Row
                                    label="Ventas en efectivo"
                                    value={money(
                                        zReport.cashReconciliation.cashSales
                                    )}
                                />
                                <Row
                                    label="Devoluciones en efectivo"
                                    value={money(
                                        zReport.cashReconciliation.cashRefunds
                                    )}
                                />
                                <Row
                                    label="Entradas / salidas"
                                    value={`${money(
                                        zReport.cashReconciliation.cashIn
                                    )} / ${money(
                                        zReport.cashReconciliation.cashOut
                                    )}`}
                                />
                            </>
                        )}
                        <Row
                            label="Esperado en caja"
                            value={money(shift.expectedBalance)}
                        />
                        <Row
                            label="Contado al cierre"
                            value={money(shift.closingBalance)}
                        />
                        <Row
                            label="Diferencia"
                            value={money(shift.discrepancy)}
                        />
                    </div>
                </Card>
            </div>

            {report ? (
                <>
                    <h5>
                        {isClosed ? 'Reporte Z' : 'Reporte X (turno en curso)'}
                    </h5>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <StatCard
                            label="Ventas"
                            value={report.salesSummary.count}
                        />
                        <StatCard
                            label="Subtotal"
                            value={formatCurrency(report.salesSummary.subtotal)}
                        />
                        <StatCard
                            label="Descuentos"
                            value={formatCurrency(report.salesSummary.discount)}
                        />
                        <StatCard
                            label="Total vendido"
                            value={formatCurrency(report.salesSummary.total)}
                            icon={<HiOutlineCurrencyDollar />}
                            tone="success"
                        />
                        {zReport && (
                            <StatCard
                                label="Devoluciones"
                                value={`${
                                    zReport.refundSummary.count
                                } · ${formatCurrency(
                                    zReport.refundSummary.total
                                )}`}
                                icon={<HiOutlineReceiptRefund />}
                                tone="danger"
                            />
                        )}
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <PaymentsByMethodTable rows={report.paymentsByMethod} />
                        <ProductsSoldTable
                            title="Productos vendidos"
                            rows={report.itemsSold}
                        />
                    </div>
                </>
            ) : (
                <div className="flex justify-center py-8">
                    <Spinner size={30} />
                </div>
            )}
        </div>
    )
}

export default ShiftDetailPage
