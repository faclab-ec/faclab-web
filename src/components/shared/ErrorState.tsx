import classNames from 'classnames'
import { HiOutlineExclamation, HiOutlineRefresh } from 'react-icons/hi'
import Button from '@/components/ui/Button'
import { getErrorMessage } from '@shared/lib/getErrorMessage'

interface ErrorStateProps {
    /** Error de la consulta; se muestra el mensaje del backend si lo trae */
    error?: unknown
    title?: string
    onRetry?: () => void
    className?: string
}

/** Una consulta falló: se dice claramente y se ofrece reintentar. */
const ErrorState = ({
    error,
    title = 'No se pudo cargar la información',
    onRetry,
    className,
}: ErrorStateProps) => (
    <div
        role="alert"
        className={classNames(
            'flex flex-col items-center justify-center gap-3 px-6 py-12 text-center',
            className
        )}
    >
        <span
            aria-hidden="true"
            className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-2xl text-red-500 dark:bg-red-500/10"
        >
            <HiOutlineExclamation />
        </span>
        <div>
            <p className="font-semibold text-gray-900 dark:text-gray-50">
                {title}
            </p>
            <p className="mt-1 text-gray-500 dark:text-gray-400">
                {getErrorMessage(
                    error,
                    'Revisa tu conexión e inténtalo de nuevo.'
                )}
            </p>
        </div>
        {onRetry && (
            <Button size="sm" icon={<HiOutlineRefresh />} onClick={onRetry}>
                Reintentar
            </Button>
        )}
    </div>
)

export default ErrorState
