import classNames from 'classnames'
import Dialog from '@/components/ui/Dialog'
import { formatDatetime } from '@shared/lib/format'
import {
    AUDIT_ACTION_LABELS,
    AUDIT_RESOURCE_LABELS,
    AUDIT_SOURCE_LABELS,
    auditChanges,
    formatAuditValue,
    type AuditEntry,
} from '../model/types'

interface AuditEntryDialogProps {
    entry: AuditEntry | null
    branchName: (branchId: number | null) => string
    onClose: () => void
}

const Field = ({ label, value }: { label: string; value: string }) => (
    <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="mt-1 break-words">{value}</p>
    </div>
)

const AuditEntryDialog = ({
    entry,
    branchName,
    onClose,
}: AuditEntryDialogProps) => {
    const changes = entry ? auditChanges(entry) : []

    return (
        <Dialog isOpen={entry !== null} width={720} onClose={onClose}>
            {entry && (
                <div>
                    <h5 className="mb-4">
                        {AUDIT_ACTION_LABELS[entry.action] ?? entry.action}
                    </h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                        <Field
                            label="Fecha"
                            value={formatDatetime(entry.occurredAt)}
                        />
                        <Field
                            label="Usuario"
                            value={
                                entry.actorName ??
                                AUDIT_SOURCE_LABELS[entry.source]
                            }
                        />
                        <Field
                            label="Recurso"
                            value={`${
                                AUDIT_RESOURCE_LABELS[entry.resourceType] ??
                                entry.resourceType
                            }${
                                entry.resourceId ? ` #${entry.resourceId}` : ''
                            }`}
                        />
                        <Field
                            label="Sucursal"
                            value={branchName(entry.branchId)}
                        />
                        <Field
                            label="Origen"
                            value={AUDIT_SOURCE_LABELS[entry.source]}
                        />
                        <div>
                            <p className="text-sm text-gray-500">
                                Id de solicitud
                            </p>
                            <p className="font-mono text-xs break-all mt-1">
                                {entry.requestId ?? '—'}
                            </p>
                        </div>
                    </div>

                    <h6 className="mb-3">Cambios</h6>
                    {changes.length === 0 ? (
                        <p className="text-sm text-gray-500">
                            Sin valores registrados
                        </p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-left text-gray-500">
                                        <th className="py-2 pr-3 font-medium">
                                            Campo
                                        </th>
                                        <th className="py-2 pr-3 font-medium">
                                            Antes
                                        </th>
                                        <th className="py-2 font-medium">
                                            Después
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {changes.map((change) => (
                                        <tr
                                            key={change.field}
                                            className="border-t border-gray-200 dark:border-gray-600 align-top"
                                        >
                                            <td className="py-2 pr-3">
                                                {change.label}
                                            </td>
                                            <td className="py-2 pr-3 break-all">
                                                {formatAuditValue(
                                                    change.before
                                                )}
                                            </td>
                                            <td
                                                className={classNames(
                                                    'py-2 break-all',
                                                    change.changed &&
                                                        'font-semibold'
                                                )}
                                            >
                                                {formatAuditValue(change.after)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </Dialog>
    )
}

export default AuditEntryDialog
