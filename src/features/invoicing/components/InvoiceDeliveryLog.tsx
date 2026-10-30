import StatusBadge from '@/components/shared/StatusBadge'
import { formatDatetime } from '@shared/lib/format'
import { useInvoiceDeliveries } from '../hooks/useInvoicing'
import {
    DELIVERY_KIND_LABELS,
    DELIVERY_STATUS_LABELS,
    DELIVERY_STATUS_TONES,
    type InvoiceDelivery,
} from '../model/types'

// Lo que explica un envío que no llegó: la respuesta del servidor o el error
const failureOf = (delivery: InvoiceDelivery): string | null => {
    if (delivery.status === 'bounced') return delivery.smtpResponse
    if (delivery.status === 'failed' || delivery.status === 'pending') {
        return delivery.lastError
    }
    return null
}

interface InvoiceDeliveryLogProps {
    invoiceId: string
}

/** Registro de envío de una factura a su comprador, el más reciente primero */
const InvoiceDeliveryLog = ({ invoiceId }: InvoiceDeliveryLogProps) => {
    const {
        data: deliveries = [],
        isLoading,
        isError,
    } = useInvoiceDeliveries(invoiceId)

    if (isLoading) {
        return <p className="text-sm text-gray-500">Cargando envíos...</p>
    }
    if (isError) {
        return (
            <p className="text-sm text-red-500">
                No se pudo cargar el registro de envío
            </p>
        )
    }
    if (deliveries.length === 0) {
        return <p className="text-sm text-gray-500">Todavía no se ha enviado</p>
    }

    return (
        <ul className="flex flex-col gap-2">
            {deliveries.map((delivery) => {
                const failure = failureOf(delivery)
                return (
                    <li
                        key={delivery.id}
                        className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700"
                    >
                        <div className="flex flex-wrap items-center gap-2">
                            <StatusBadge
                                tone={DELIVERY_STATUS_TONES[delivery.status]}
                            >
                                {DELIVERY_STATUS_LABELS[delivery.status]}
                            </StatusBadge>
                            <span className="text-sm">
                                {delivery.recipient ??
                                    'Sin correo del comprador'}
                            </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                            {DELIVERY_KIND_LABELS[delivery.kind]}
                            {delivery.requestedBy &&
                                `, por ${delivery.requestedBy}`}{' '}
                            ·{' '}
                            {formatDatetime(
                                delivery.sentAt ?? delivery.updatedAt
                            )}
                            {delivery.attempts > 0 &&
                                ` · intentos: ${delivery.attempts}`}
                        </p>
                        {failure && (
                            <p className="text-xs text-gray-400 mt-1 break-words">
                                {failure}
                            </p>
                        )}
                    </li>
                )
            })}
        </ul>
    )
}

export default InvoiceDeliveryLog
