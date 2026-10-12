import classNames from 'classnames'
import type { ReactNode } from 'react'
import type { StatusTone } from '@shared/lib/statusTone'

const TONE_CLASSES: Record<StatusTone, string> = {
    success:
        'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-400/25',
    neutral:
        'bg-gray-100 text-gray-700 ring-gray-500/20 dark:bg-gray-500/10 dark:text-gray-300 dark:ring-gray-400/25',
    warning:
        'bg-amber-50 text-amber-800 ring-amber-600/25 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-400/25',
    danger: 'bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-500/10 dark:text-red-300 dark:ring-red-400/25',
    info: 'bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-500/10 dark:text-blue-300 dark:ring-blue-400/25',
}

interface StatusBadgeProps {
    tone?: StatusTone
    children: ReactNode
    className?: string
}

/** Etiqueta de estado. El color sale del tono, nunca de clases sueltas. */
const StatusBadge = ({
    tone = 'neutral',
    children,
    className,
}: StatusBadgeProps) => (
    <span
        className={classNames(
            'inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset',
            TONE_CLASSES[tone],
            className
        )}
    >
        {children}
    </span>
)

interface ActiveBadgeProps {
    active: boolean
}

/** Estado activo/inactivo de un registro de catálogo. */
export const ActiveBadge = ({ active }: ActiveBadgeProps) => (
    <StatusBadge tone={active ? 'success' : 'neutral'}>
        {active ? 'Activo' : 'Inactivo'}
    </StatusBadge>
)

export default StatusBadge
