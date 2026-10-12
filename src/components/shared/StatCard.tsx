import classNames from 'classnames'
import Card from '@/components/ui/Card'
import Skeleton from '@/components/ui/Skeleton'
import type { ReactNode } from 'react'
import type { StatusTone } from '@shared/lib/statusTone'

const ICON_TONE_CLASSES: Record<StatusTone, string> = {
    success:
        'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400',
    neutral: 'bg-gray-100 text-gray-500 dark:bg-gray-700/60 dark:text-gray-300',
    warning:
        'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400',
    danger: 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400',
    info: 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400',
}

interface StatCardProps {
    label: string
    value: ReactNode
    icon?: ReactNode
    tone?: StatusTone
    /** Contexto corto bajo la cifra */
    hint?: ReactNode
    loading?: boolean
    /** Si se pasa, la tarjeta completa es un botón */
    onClick?: () => void
    /** La tarjeta filtra el contenido de abajo y es la opción elegida */
    selected?: boolean
    className?: string
}

/** Una cifra clave con su etiqueta: indicadores del resumen y los reportes. */
const StatCard = ({
    label,
    value,
    icon,
    tone = 'neutral',
    hint,
    loading = false,
    onClick,
    selected,
    className,
}: StatCardProps) => {
    const content = (
        <Card
            className={classNames(
                'h-full',
                onClick &&
                    'transition-shadow duration-150 group-hover:shadow-pop',
                selected && 'ring-2 ring-primary-500'
            )}
        >
            <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    {label}
                </p>
                {icon && (
                    <span
                        aria-hidden="true"
                        className={classNames(
                            'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-lg',
                            ICON_TONE_CLASSES[tone]
                        )}
                    >
                        {icon}
                    </span>
                )}
            </div>
            {/* La cifra ocupa todo el ancho: nunca se recorta, si no cabe salta de línea */}
            {loading ? (
                <Skeleton className="mt-3" width={96} height={24} />
            ) : (
                <p className="mt-1 break-words text-xl font-semibold tracking-tight text-gray-900 dark:text-gray-50 sm:text-2xl">
                    {value}
                </p>
            )}
            {hint && !loading && (
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {hint}
                </p>
            )}
        </Card>
    )

    if (!onClick) {
        return <div className={className}>{content}</div>
    }

    return (
        <button
            type="button"
            aria-pressed={selected}
            className={classNames(
                'group block w-full rounded-xl text-left',
                className
            )}
            onClick={onClick}
        >
            {content}
        </button>
    )
}

export default StatCard
