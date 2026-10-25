import classNames from 'classnames'
import { HiOutlineOfficeBuilding } from 'react-icons/hi'
import Spinner from '@/components/ui/Spinner'
import { ROLE_LABELS } from '@/constants/roles.constant'
import type { TenantOption } from '@/@types/auth'
import { tenantDisplayName } from '../lib/tenant'

interface TenantPickerProps {
    tenants: TenantOption[]
    /** La empresa de la sesión actual, que no se puede volver a elegir */
    currentId?: string
    /** La empresa que se está abriendo */
    pendingId?: string | null
    disabled?: boolean
    onSelect: (tenant: TenantOption) => void
}

/** Las empresas del usuario, para elegir en cuál trabajar. */
const TenantPicker = ({
    tenants,
    currentId,
    pendingId,
    disabled = false,
    onSelect,
}: TenantPickerProps) => (
    <ul aria-label="Empresas" className="flex flex-col gap-2">
        {tenants.map((tenant) => {
            const isCurrent = tenant.id === currentId
            return (
                <li key={tenant.id}>
                    <button
                        type="button"
                        disabled={disabled || isCurrent}
                        className={classNames(
                            'flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-left transition-colors duration-150 disabled:cursor-not-allowed',
                            isCurrent
                                ? 'border-primary-500 bg-primary-50 dark:bg-primary-500/10'
                                : 'border-gray-200 hover:border-primary-400 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700/50'
                        )}
                        onClick={() => onSelect(tenant)}
                    >
                        <HiOutlineOfficeBuilding
                            aria-hidden="true"
                            className="shrink-0 text-2xl text-gray-400"
                        />
                        <span className="min-w-0 flex-1">
                            <span className="block truncate font-semibold text-gray-900 dark:text-gray-50">
                                {tenantDisplayName(tenant)}
                            </span>
                            <span className="block truncate text-xs text-gray-500 dark:text-gray-400">
                                {tenant.tradeName && `${tenant.legalName} · `}
                                RUC {tenant.ruc}
                            </span>
                        </span>
                        {pendingId === tenant.id ? (
                            <Spinner size={18} />
                        ) : (
                            <span className="shrink-0 text-xs text-gray-500 dark:text-gray-400">
                                {isCurrent
                                    ? 'Actual'
                                    : ROLE_LABELS[tenant.role]}
                            </span>
                        )}
                    </button>
                </li>
            )
        })}
    </ul>
)

export default TenantPicker
