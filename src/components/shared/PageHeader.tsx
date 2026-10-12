import classNames from 'classnames'
import { HiOutlineArrowLeft } from 'react-icons/hi'
import Button from '@/components/ui/Button'
import type { ReactNode } from 'react'

interface PageHeaderProps {
    title: string
    description?: ReactNode
    /** Acciones de la página (botón principal, filtros globales) */
    actions?: ReactNode
    /** Estado del registro, junto al título (páginas de detalle) */
    badge?: ReactNode
    /** Páginas de detalle: vuelve a la lista de la que se vino */
    onBack?: () => void
    className?: string
}

/** Título de la página, con su descripción y acciones. Una sola por página. */
const PageHeader = ({
    title,
    description,
    actions,
    badge,
    onBack,
    className,
}: PageHeaderProps) => (
    <header
        className={classNames(
            'mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between',
            className
        )}
    >
        <div className="flex min-w-0 items-start gap-2">
            {onBack && (
                <Button
                    size="sm"
                    variant="plain"
                    className="-ml-2 shrink-0"
                    aria-label="Volver"
                    icon={<HiOutlineArrowLeft />}
                    onClick={onBack}
                />
            )}
            <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <h1>{title}</h1>
                    {badge}
                </div>
                {description && (
                    <p className="mt-1 text-gray-500 dark:text-gray-400">
                        {description}
                    </p>
                )}
            </div>
        </div>
        {actions && (
            <div className="flex flex-wrap items-center gap-2">{actions}</div>
        )}
    </header>
)

export default PageHeader
