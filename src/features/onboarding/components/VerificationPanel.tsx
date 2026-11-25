import { HiOutlineCheckCircle, HiOutlineXCircle } from 'react-icons/hi'
import Alert from '@/components/ui/Alert'
import Button from '@/components/ui/Button'
import { notifyError } from '@shared/ui/notify'
import type { InvoicingStatus } from '@features/invoicing'
import { useSubmitTestInvoice, useTestInvoice } from '../hooks/useOnboarding'
import {
    ONBOARDING_ERROR_MESSAGES,
    TEST_INVOICE_STATUS_LABELS,
} from '../model/types'

interface Props {
    invoicing: InvoicingStatus | undefined
    blocked: boolean
}

/** Readiness de la facturación y la factura de prueba contra el SRI de pruebas */
const VerificationPanel = ({ invoicing, blocked }: Props) => {
    const { data: test } = useTestInvoice()
    const submit = useSubmitTestInvoice()
    const issues = invoicing?.issues ?? []
    const errors = issues.filter((issue) => issue.severity === 'error')
    const inTesting = invoicing?.environment === 1
    const processing = test?.status === 'PROCESSING' || submit.isPending

    const send = async () => {
        try {
            await submit.mutateAsync()
        } catch (err) {
            notifyError(err, 'No se pudo emitir la factura de prueba', {
                messages: ONBOARDING_ERROR_MESSAGES,
            })
        }
    }

    return (
        <div className="mt-3 space-y-3">
            <p className="flex items-center gap-2 text-sm">
                {invoicing?.ready ? (
                    <HiOutlineCheckCircle className="text-lg text-emerald-500" />
                ) : (
                    <HiOutlineXCircle className="text-lg text-red-500" />
                )}
                {invoicing?.ready
                    ? 'La facturación está lista.'
                    : 'La facturación todavía no está lista.'}
            </p>
            {errors.map((issue) => (
                <Alert key={issue.code} showIcon type="danger">
                    {issue.message}
                </Alert>
            ))}

            {inTesting && (
                <div className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                    <p className="mb-2 text-sm font-semibold">
                        Factura de prueba
                    </p>
                    <p className="mb-3 text-sm text-gray-500">
                        Se emite por 1 centavo al consumidor final en el
                        ambiente de pruebas del SRI: prueba el certificado, el
                        perfil y la conexión. No es una venta ni se publica.
                    </p>
                    <p className="mb-3 text-sm">
                        {TEST_INVOICE_STATUS_LABELS[test?.status ?? 'NONE']}
                        {test?.number && <> · {test.number}</>}
                    </p>
                    {test?.status === 'REJECTED' && test.reason && (
                        <Alert showIcon className="mb-3" type="danger">
                            {test.reason}
                        </Alert>
                    )}
                    <Button
                        disabled={blocked || !invoicing?.ready || processing}
                        loading={submit.isPending}
                        size="sm"
                        variant="solid"
                        onClick={send}
                    >
                        {test?.status === 'REJECTED' ||
                        test?.status === 'AUTHORIZED'
                            ? 'Emitir otra factura de prueba'
                            : 'Emitir factura de prueba'}
                    </Button>
                </div>
            )}
            {!inTesting && invoicing?.environment === 2 && (
                <Alert showIcon type="info">
                    La empresa ya emite en producción.
                </Alert>
            )}
        </div>
    )
}

export default VerificationPanel
