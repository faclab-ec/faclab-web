import { isApiError } from '@/utils/errors/ApiError'

/** De dónde vino el error: el ErrorBoundary o los oyentes de `window` */
export type ErrorSource = 'boundary' | 'window' | 'unhandledrejection'

export type ErrorContext = {
    source: ErrorSource
    /** Stack de componentes de React (solo nombres, sin props) */
    componentStack?: string
}

export type ErrorReport = {
    exception: { name: string; message: string; stack?: string }
    attributes: Record<string, string | number>
}

const MAX_MESSAGE = 500
const MAX_STACK = 4000
const MAX_COMPONENT_STACK = 2000

const truncate = (value: string, max: number) =>
    value.length > max ? `${value.slice(0, max)}…` : value

/**
 * El stack de V8 empieza con `Nombre: mensaje`; de un `ApiError` ese mensaje
 * es del servidor, así que se cambia por el código.
 */
const stackWithHeading = (error: Error, heading: string) => {
    const original = `${error.name}: ${error.message}`
    const stack =
        error.stack && error.stack.startsWith(original)
            ? heading + error.stack.slice(original.length)
            : error.stack
    return stack && truncate(stack, MAX_STACK)
}

/**
 * Lo que se informa de un error, sin datos del formulario ni del usuario: el
 * tipo, el mensaje del código y el stack. De un `ApiError` solo van el código,
 * el estado y el id de solicitud; su mensaje viene del servidor y puede repetir
 * lo que se envió.
 */
export function describeError(
    error: unknown,
    context: ErrorContext
): ErrorReport {
    const attributes: Record<string, string | number> = {
        'faclab.error.source': context.source,
    }
    if (context.componentStack) {
        attributes['faclab.react.component_stack'] = truncate(
            context.componentStack.trim(),
            MAX_COMPONENT_STACK
        )
    }

    if (isApiError(error)) {
        attributes['error.type'] = error.code
        attributes['faclab.error.code'] = error.code
        if (error.status > 0) {
            attributes['http.response.status_code'] = error.status
        }
        if (error.requestId) {
            attributes['http.request.id'] = error.requestId
        }
        return {
            exception: {
                name: 'ApiError',
                message: error.code,
                stack: stackWithHeading(error, `ApiError: ${error.code}`),
            },
            attributes,
        }
    }

    if (error instanceof Error) {
        const name = error.name || 'Error'
        attributes['error.type'] = name
        return {
            exception: {
                name,
                message: truncate(error.message, MAX_MESSAGE),
                stack: error.stack && truncate(error.stack, MAX_STACK),
            },
            attributes,
        }
    }

    // `throw 'texto'` o un rechazo con un valor que no es Error
    const name = typeof error === 'string' ? 'string' : typeof error
    attributes['error.type'] = name
    return {
        exception: {
            name,
            message:
                typeof error === 'string'
                    ? truncate(error, MAX_MESSAGE)
                    : `Non-Error ${name} thrown`,
        },
        attributes,
    }
}
