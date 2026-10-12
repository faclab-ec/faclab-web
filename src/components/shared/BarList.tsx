import classNames from 'classnames'

export interface BarListItem {
    key: string | number
    label: string
    value: number
    /** Dato de apoyo bajo el nombre (por ejemplo, la parte del total) */
    caption?: string
}

interface BarListProps {
    items: BarListItem[]
    formatValue: (value: number) => string
    /** Qué se compara, para lectores de pantalla */
    'aria-label': string
    className?: string
}

/**
 * Compara una magnitud entre pocas categorías: una barra por fila, todas del
 * mismo color y desde la misma base. El valor va escrito en cada fila, así
 * que no depende del color ni de pasar el cursor.
 */
const BarList = ({
    items,
    formatValue,
    'aria-label': ariaLabel,
    className,
}: BarListProps) => {
    const max = Math.max(0, ...items.map((item) => item.value))

    return (
        <ul
            aria-label={ariaLabel}
            className={classNames('flex flex-col gap-4', className)}
        >
            {items.map((item) => {
                const ratio = max > 0 ? item.value / max : 0

                return (
                    <li
                        key={item.key}
                        title={`${item.label}: ${formatValue(item.value)}`}
                    >
                        <div className="flex items-baseline justify-between gap-3">
                            <span className="min-w-0 truncate font-medium text-gray-700 dark:text-gray-200">
                                {item.label}
                            </span>
                            <span className="shrink-0 font-semibold tabular-nums text-gray-900 dark:text-gray-50">
                                {formatValue(item.value)}
                            </span>
                        </div>
                        <div className="mt-1.5 h-2.5">
                            <div
                                className="h-full rounded-r bg-primary-600 dark:bg-primary-500"
                                // Un valor mayor que cero siempre deja una marca visible
                                style={{
                                    width:
                                        item.value > 0
                                            ? `max(${ratio * 100}%, 4px)`
                                            : 0,
                                }}
                            />
                        </div>
                        {item.caption && (
                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                {item.caption}
                            </p>
                        )}
                    </li>
                )
            })}
        </ul>
    )
}

export default BarList
