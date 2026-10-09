import { useInvoicingStatus } from '../hooks/useInvoicing'
import { issueLabel } from '../model/types'

const CHIP_CLASS =
    'px-2 py-1 text-xs rounded-full font-medium bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300'

/**
 * Compact version of the invoicing warning for screens without the app layout
 * (the POS). Hover shows why.
 */
const InvoicingStatusChip = () => {
    const { data: status, isError } = useInvoicingStatus()

    if (isError) {
        return (
            <span
                className={CHIP_CLASS}
                title="El servicio de facturación no responde"
            >
                Facturación sin verificar
            </span>
        )
    }
    if (!status) return null

    if (!status.ready) {
        const reasons = status.issues
            .filter((i) => i.severity === 'error')
            .map((i) => issueLabel(i.code))
        return (
            <span
                className={CHIP_CLASS}
                title={`${reasons.join(
                    '\n'
                )}\nLas facturas quedan pendientes hasta completar la configuración.`}
            >
                Facturación no configurada
            </span>
        )
    }

    if (status.invoicesWithIssues > 0) {
        return (
            <span
                className={CHIP_CLASS}
                title="Revisa Ventas → Facturas, filtro «Requieren atención»"
            >
                {status.invoicesWithIssues === 1
                    ? '1 factura con problemas'
                    : `${status.invoicesWithIssues} facturas con problemas`}
            </span>
        )
    }

    return null
}

export default InvoicingStatusChip
