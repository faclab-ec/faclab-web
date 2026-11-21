import classNames from 'classnames'

/**
 * Id de solicitud de un error del backend, para que soporte lo encuentre en
 * los logs y las trazas (`http.request.id`). Completo y seleccionable.
 */
const RequestId = ({ id, className }: { id: string; className?: string }) => (
    <p
        className={classNames(
            'mt-1 text-xs text-gray-500 dark:text-gray-400',
            className
        )}
    >
        Id de solicitud:
        <span className="block font-mono break-all select-all">{id}</span>
    </p>
)

export default RequestId
