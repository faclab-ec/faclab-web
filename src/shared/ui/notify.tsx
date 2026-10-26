import Notification from '@/components/ui/Notification'
import toast from '@/components/ui/toast'
import type { NotificationPlacement } from '@/components/ui/@types/placement'
import {
    getErrorMessage,
    type ErrorMessages,
} from '@shared/lib/getErrorMessage'

const DEFAULT_PLACEMENT: NotificationPlacement = 'top-center'

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
    toast.push(
        <Notification title="Error" type="danger">
            {getErrorMessage(error, fallback, options?.messages)}
        </Notification>,
        { placement: options?.placement ?? DEFAULT_PLACEMENT }
    )
}
