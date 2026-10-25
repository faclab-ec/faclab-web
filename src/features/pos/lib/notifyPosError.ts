import { notifyError } from '@shared/ui/notify'
import { posErrorMessage } from '../model/errors'

/** `notifyError` con los mensajes del POS en español. */
export const notifyPosError = (error: unknown, fallback: string): void =>
    notifyError(undefined, posErrorMessage(error, fallback))
