import classNames from 'classnames'
import { HiOutlineInbox } from 'react-icons/hi'
import type { ReactNode } from 'react'

interface EmptyStateProps {
    title?: string
    description?: ReactNode
    icon?: ReactNode
    /** Qué puede hacer el usuario desde aquí (por ejemplo, crear el primero) */
    action?: ReactNode
    className?: string
}

/** No hay nada que mostrar, y no es un error. */
const EmptyState = ({
    title = 'No hay registros para mostrar',
    description,
    icon = <HiOutlineInbox />,
    action,
    className,
}: EmptyStateProps) => (
    <div
        className={classNames(
            'flex flex-col items-center justify-center gap-3 px-6 py-12 text-center',
            className
        )}
    >
        <span
            aria-hidden="true"
            className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 text-2xl text-gray-400 dark:bg-gray-700/60 dark:text-gray-400"
        >
            {icon}
        </span>
        <div>
            <p className="font-semibold text-gray-900 dark:text-gray-50">
                {title}
            </p>
            {description && (
                <p className="mt-1 text-gray-500 dark:text-gray-400">
                    {description}
                </p>
            )}
        </div>
        {action}
    </div>
)

export default EmptyState
