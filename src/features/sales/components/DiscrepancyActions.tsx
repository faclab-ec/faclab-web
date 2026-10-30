import Button from '@/components/ui/Button'
import { useInvoiceRetryAction, useInvoicesBySale } from '@features/invoicing'
import { notifyError, notifySuccess } from '@shared/ui/notify'
import { useRequestInvoice } from '../hooks/useSales'
import { discrepancyActions } from '../model/discrepancies'
import type { InvoiceDiscrepancy } from '../model/types'

interface DiscrepancyActionsProps {
    discrepancy: InvoiceDiscrepancy
    onReview: (discrepancy: InvoiceDiscrepancy) => void
}

/** Reenviar la venta, reintentar su factura en facturación o marcarla revisada */
const DiscrepancyActionButtons = ({
    discrepancy,
    onReview,
}: DiscrepancyActionsProps) => {
    const { data: invoices, isError } = useInvoicesBySale(discrepancy.saleId)
    const requestInvoice = useRequestInvoice()
    const retry = useInvoiceRetryAction()
    const actions = discrepancyActions(
        discrepancy,
        isError ? undefined : invoices
    )

    const handleResend = async () => {
        try {
            await requestInvoice.mutateAsync(discrepancy.saleId)
            notifySuccess(
                'Venta reenviada a facturación',
                'La factura aparecerá en unos momentos'
            )
        } catch (error) {
            notifyError(error, 'No se pudo reenviar la venta a facturación')
        }
    }

    return (
        <div className="flex flex-wrap gap-2">
            {actions.resend && (
                <Button
                    size="sm"
                    loading={requestInvoice.isPending}
                    onClick={handleResend}
                >
                    Reenviar
                </Button>
            )}
            {actions.retry && (
                <Button
                    size="sm"
                    loading={retry.retryingId === actions.retry.id}
                    onClick={() => actions.retry && retry.run(actions.retry)}
                >
                    Reintentar en facturación
                </Button>
            )}
            {actions.review && (
                <Button
                    size="sm"
                    variant="plain"
                    onClick={() => onReview(discrepancy)}
                >
                    Marcar revisada
                </Button>
            )}
        </div>
    )
}

export default DiscrepancyActionButtons
