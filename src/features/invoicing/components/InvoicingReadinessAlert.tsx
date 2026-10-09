import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Alert from '@/components/ui/Alert'
import Button from '@/components/ui/Button'
import { useCan } from '@/stores'
import { formatDate } from '@shared/lib/format'
import { useInvoicingStatus } from '../hooks/useInvoicing'
import { issueLabel, type InvoicingStatus } from '../model/types'

interface InvoicingReadinessAlertProps {
    // Links to fix it (config pages, invoices that need attention)
    showActions?: boolean
    rounded?: boolean
    className?: string
}

const plural = (count: number, one: string, many: string) =>
    count === 1 ? one : many

function warningText(status: InvoicingStatus, code: string): string {
    if (code === 'CERTIFICATE_EXPIRING_SOON' && status.certificate) {
        return `El certificado de firma vence el ${formatDate(
            status.certificate.validTo
        )}: sube uno nuevo antes de esa fecha`
    }
    return issueLabel(code)
}

/**
 * Says when invoices can't go out, before anyone finds out at the SRI:
 * - the issuer isn't ready (fiscal config, certificate): sales still go
 *   through, and their invoices wait and go out once it is fixed;
 * - some invoices are stuck (SRI down, rejected data...);
 * - warnings (certificate about to expire, test environment), dismissible.
 */
const InvoicingReadinessAlert = ({
    showActions = true,
    rounded = true,
    className,
}: InvoicingReadinessAlertProps) => {
    const navigate = useNavigate()
    const canConfigure = useCan('user:manage')
    const { data: status, isError } = useInvoicingStatus()
    const [warningsDismissed, setWarningsDismissed] = useState(false)

    if (isError) {
        return (
            <Alert
                showIcon
                type="warning"
                rounded={rounded}
                className={className}
            >
                No se pudo verificar la facturación electrónica: el servicio de
                facturación no responde
            </Alert>
        )
    }
    if (!status) return null

    if (!status.ready) {
        const errors = status.issues.filter((i) => i.severity === 'error')
        return (
            <Alert
                showIcon
                type="warning"
                title="La facturación electrónica no está lista"
                rounded={rounded}
                className={className}
            >
                <ul className="list-disc ml-4 mt-1">
                    {errors.map((issue) => (
                        <li key={issue.code}>{issueLabel(issue.code)}</li>
                    ))}
                </ul>
                <p className="mt-2">
                    Las ventas se registran igual: sus facturas quedan
                    pendientes y se emiten solas cuando se complete la
                    configuración.
                    {status.pendingInvoices > 0 &&
                        ` ${status.pendingInvoices} ${plural(
                            status.pendingInvoices,
                            'factura espera',
                            'facturas esperan'
                        )}.`}
                </p>
                {showActions &&
                    (canConfigure ? (
                        <div className="flex flex-wrap gap-2 mt-3">
                            <Button
                                size="xs"
                                onClick={() =>
                                    navigate('/settings/company-config')
                                }
                            >
                                Configuración fiscal
                            </Button>
                            <Button
                                size="xs"
                                onClick={() =>
                                    navigate('/settings/certificates')
                                }
                            >
                                Certificados digitales
                            </Button>
                        </div>
                    ) : (
                        <p className="mt-2">
                            Pide a un administrador que la complete.
                        </p>
                    ))}
            </Alert>
        )
    }

    if (status.invoicesWithIssues > 0) {
        const count = status.invoicesWithIssues
        return (
            <Alert
                showIcon
                type="warning"
                rounded={rounded}
                className={className}
            >
                <span>
                    {count}{' '}
                    {plural(
                        count,
                        'factura no avanzó en su último intento',
                        'facturas no avanzaron en su último intento'
                    )}
                    .{' '}
                </span>
                {showActions && (
                    <button
                        className="underline"
                        onClick={() => navigate('/invoices?attention=1')}
                    >
                        Ver facturas
                    </button>
                )}
            </Alert>
        )
    }

    const warnings = status.issues.filter((i) => i.severity === 'warning')
    if (warnings.length > 0 && !warningsDismissed) {
        return (
            <Alert
                showIcon
                closable
                type="info"
                duration={0}
                rounded={rounded}
                className={className}
                onClose={() => setWarningsDismissed(true)}
            >
                {warnings.map((issue) => (
                    <div key={issue.code}>
                        {warningText(status, issue.code)}
                    </div>
                ))}
            </Alert>
        )
    }

    return null
}

export default InvoicingReadinessAlert
