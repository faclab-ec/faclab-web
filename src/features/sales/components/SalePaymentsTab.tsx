import Table from '@/components/ui/Table'
import { formatCurrency, formatDate } from '@shared/lib/format'
import { PAYMENT_METHOD_LABELS } from '../model/types'
import { useSalePayments } from '../hooks/useSales'

const { Tr, Th, Td, THead, TBody, TFoot } = Table

interface SalePaymentsTabProps {
    saleId: number
    saleTotal: number
}

const SalePaymentsTab = ({ saleId, saleTotal }: SalePaymentsTabProps) => {
    const { data: payments = [], isLoading } = useSalePayments(saleId)

    const paymentsTotal = payments.reduce((sum, p) => sum + p.amount, 0)

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-32">
                <div>Cargando pagos...</div>
            </div>
        )
    }

    if (payments.length === 0) {
        return (
            <div className="text-center py-8 text-gray-500">
                No hay pagos registrados
            </div>
        )
    }

    return (
        <>
            <Table>
                <THead>
                    <Tr>
                        <Th>Método</Th>
                        <Th>Monto</Th>
                        <Th>Fecha de Pago</Th>
                        <Th>Referencia</Th>
                        <Th>Notas</Th>
                    </Tr>
                </THead>
                <TBody>
                    {payments.map((payment) => (
                        <Tr key={payment.id}>
                            <Td>
                                {PAYMENT_METHOD_LABELS[payment.paymentMethod]}
                            </Td>
                            <Td className="font-medium">
                                {formatCurrency(payment.amount)}
                            </Td>
                            <Td>
                                {payment.paymentDate
                                    ? formatDate(payment.paymentDate)
                                    : '-'}
                            </Td>
                            <Td>{payment.reference ?? '-'}</Td>
                            <Td>{payment.notes ?? '-'}</Td>
                        </Tr>
                    ))}
                </TBody>
                <TFoot>
                    <Tr>
                        <Td className="font-medium">Total Pagado</Td>
                        <Td className="font-semibold">
                            {formatCurrency(paymentsTotal)}
                        </Td>
                        <Td colSpan={3} />
                    </Tr>
                </TFoot>
            </Table>
            {paymentsTotal < saleTotal && (
                <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-500/10 rounded-lg text-sm text-amber-700 dark:text-amber-400">
                    Saldo pendiente:{' '}
                    <span className="font-semibold">
                        {formatCurrency(saleTotal - paymentsTotal)}
                    </span>
                </div>
            )}
        </>
    )
}

export default SalePaymentsTab
