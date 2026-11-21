import Notification from '@/components/ui/Notification'
import toast from '@/components/ui/toast'
import type { NotificationPlacement } from '@/components/ui/@types/placement'
import {
    getErrorMessage,
    getErrorRequestId,
    type ErrorMessages,
} from '@shared/lib/getErrorMessage'
import RequestId from '@shared/ui/RequestId'

const DEFAULT_PLACEMENT: NotificationPlacement = 'top-center'

/** Con id de solicitud el aviso dura más y se puede cerrar: hay que copiarlo */
const ERROR_WITH_REQUEST_ID_DURATION_MS = 8000

export type NotifyOptions = {
    placement?: NotificationPlacement
}

export function notifySuccess(
    title: string,
    message?: string,
    options?: NotifyOptions
): void {
    toast.push(
        <Notification title={title} type="success">
            {message}
        </Notification>,
        { placement: options?.placement ?? DEFAULT_PLACEMENT }
    )
}

export function notifyInfo(
    title: string,
    message?: string,
    options?: NotifyOptions
): void {
    toast.push(
        <Notification title={title} type="info">
            {message}
        </Notification>,
        { placement: options?.placement ?? DEFAULT_PLACEMENT }
    )
}

export function notifyWarning(
    title: string,
    message?: string,
    options?: NotifyOptions
): void {
    toast.push(
        <Notification title={title} type="warning">
            {message}
        </Notification>,
        { placement: options?.placement ?? DEFAULT_PLACEMENT }
    )
}

export function notifyError(
    error: unknown,
    fallback: string,
    options?: NotifyOptions & { messages?: ErrorMessages }
): void {
    const requestId = getErrorRequestId(error)
    toast.push(
        <Notification
            title="Error"
            type="danger"
            closable={!!requestId}
            duration={requestId ? ERROR_WITH_REQUEST_ID_DURATION_MS : undefined}
        >
            <p>{getErrorMessage(error, fallback, options?.messages)}</p>
            {requestId && <RequestId id={requestId} />}
        </Notification>,
        { placement: options?.placement ?? DEFAULT_PLACEMENT }
    )
}
