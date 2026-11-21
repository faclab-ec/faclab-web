import type { Context } from '@opentelemetry/api'
import type {
    ReadableSpan,
    Span,
    SpanProcessor,
} from '@opentelemetry/sdk-trace-web'

const REDACTED = 'REDACTED'

/** `a=1&b=2` → `a=REDACTED&b=REDACTED`: quedan los nombres de los filtros */
export function redactQueryString(query: string): string {
    return query
        .split('&')
        .filter(Boolean)
        .map((pair) => {
            const separator = pair.indexOf('=')
            const key = separator === -1 ? pair : pair.slice(0, separator)
            return `${key}=${REDACTED}`
        })
        .join('&')
}

/**
 * Quita los valores del query string y el fragmento de una URL: las búsquedas
 * por nombre, RUC o código de barras no salen del navegador.
 */
export function redactUrl(url: string): string {
    const hash = url.indexOf('#')
    const withoutHash = hash === -1 ? url : url.slice(0, hash)
    const question = withoutHash.indexOf('?')
    if (question === -1) {
        return withoutHash
    }
    const path = withoutHash.slice(0, question)
    const query = redactQueryString(withoutHash.slice(question + 1))
    return query ? `${path}?${query}` : path
}

const URL_ATTRIBUTES = ['url.full', 'http.url']
const QUERY_ATTRIBUTE = 'url.query'

/**
 * Redacta las URLs de cada span justo antes de que termine (`onEnding`, cuando
 * todavía se puede escribir): carga del documento, recursos, XHR y fetch.
 */
export class RedactUrlProcessor implements SpanProcessor {
    onStart(_span: Span, _parentContext: Context): void {}

    onEnding(span: Span): void {
        for (const key of URL_ATTRIBUTES) {
            const value = span.attributes[key]
            if (typeof value === 'string') {
                span.setAttribute(key, redactUrl(value))
            }
        }
        const query = span.attributes[QUERY_ATTRIBUTE]
        if (typeof query === 'string') {
            span.setAttribute(QUERY_ATTRIBUTE, redactQueryString(query))
        }
    }

    onEnd(_span: ReadableSpan): void {}

    forceFlush(): Promise<void> {
        return Promise.resolve()
    }

    shutdown(): Promise<void> {
        return Promise.resolve()
    }
}
