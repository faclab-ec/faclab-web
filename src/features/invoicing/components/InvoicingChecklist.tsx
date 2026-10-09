import type { ReactElement } from 'react'
import { HiCheckCircle, HiExclamation, HiXCircle } from 'react-icons/hi'
import { formatDate } from '@shared/lib/format'
import { issueLabel, type InvoicingStatus } from '../model/types'

type CheckState = 'ok' | 'warning' | 'error'

interface Check {
    label: string
    state: CheckState
    detail: string
}

const ICONS: Record<CheckState, ReactElement> = {
    ok: <HiCheckCircle className="text-emerald-500 text-lg shrink-0" />,
    warning: <HiExclamation className="text-amber-500 text-lg shrink-0" />,
    error: <HiXCircle className="text-red-500 text-lg shrink-0" />,
}

function readinessChecks(status: InvoicingStatus): Check[] {
    const has = (code: string) => status.issues.some((i) => i.code === code)
    const configError = ['CONFIG_MISSING', 'CONFIG_INVALID'].find(has)
    const certificateError = [
        'CERTIFICATE_NOT_SELECTED',
        'CERTIFICATE_NOT_FOUND',
        'CERTIFICATE_EXPIRED',
        'CERTIFICATE_UNREADABLE',
    ].find(has)

    const certificateCheck: Check = certificateError
        ? {
              label: 'Certificado de firma',
              state: 'error',
              detail: issueLabel(certificateError),
          }
        : status.certificate
        ? {
              label: 'Certificado de firma',
              state: has('CERTIFICATE_EXPIRING_SOON') ? 'warning' : 'ok',
              detail: `Vigente hasta el ${formatDate(
                  status.certificate.validTo
              )}`,
          }
        : {
              label: 'Certificado de firma',
              state: 'error',
              detail: issueLabel('CERTIFICATE_NOT_SELECTED'),
          }

    return [
        configError
            ? {
                  label: 'Configuración fiscal',
                  state: 'error',
                  detail: issueLabel(configError),
              }
            : {
                  label: 'Configuración fiscal',
                  state: 'ok',
                  detail: 'Completa',
              },
        certificateCheck,
        {
            label: 'Ambiente del SRI',
            state:
                status.environment === 2
                    ? 'ok'
                    : status.environment === 1
                    ? 'warning'
                    : 'error',
            detail:
                status.environment === 2
                    ? 'Producción'
                    : status.environment === 1
                    ? 'Pruebas: las facturas no tienen validez tributaria'
                    : 'Sin configurar',
        },
    ]
}

interface InvoicingChecklistProps {
    status: InvoicingStatus
}

/** What the issuer needs before invoices can go out, item by item */
const InvoicingChecklist = ({ status }: InvoicingChecklistProps) => (
    <ul className="flex flex-col gap-2">
        {readinessChecks(status).map((check) => (
            <li key={check.label} className="flex items-start gap-2">
                {ICONS[check.state]}
                <div className="text-sm">
                    <span className="font-medium">{check.label}</span>
                    <span className="text-gray-500 dark:text-gray-400">
                        {' '}
                        — {check.detail}
                    </span>
                </div>
            </li>
        ))}
    </ul>
)

export default InvoicingChecklist
