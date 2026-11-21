/**
 * Telemetría del navegador (S7.3, OBSERVABILITY.md §9.3): trazas de la carga y
 * de las llamadas al core y la facturación, errores de interfaz y web vitals.
 *
 * Este módulo va en el bundle principal y es mínimo: con la telemetría apagada
 * (por defecto, y el rollback) no hace nada. Encendida, escucha los errores de
 * `window` desde el arranque y carga el SDK en un chunk aparte; los errores
 * que lleguen mientras tanto esperan en una cola corta.
 */
import appConfig, { type TelemetryConfig } from '@/configs/app.config'
import type { ErrorContext } from './errors'
import { currentRoute } from './routes'

export { setRoute } from './routes'
export type { ErrorContext, ErrorSource } from './errors'

type Reporter = (error: unknown, context: ErrorContext, route: string) => void
type PendingError = { error: unknown; context: ErrorContext; route: string }

const MAX_PENDING = 20

/** Ruido del navegador sin consecuencia para el usuario */
const IGNORED_WINDOW_ERRORS = [/^ResizeObserver loop/]

let state: 'off' | 'loading' | 'on' = 'off'
let reporter: Reporter | null = null
let pending: PendingError[] = []

/** Informa un error de interfaz; no hace nada con la telemetría apagada */
export function reportError(error: unknown, context: ErrorContext): void {
    if (state === 'off') {
        return
    }
    const route = currentRoute()
    if (reporter) {
        reporter(error, context, route)
    } else if (pending.length < MAX_PENDING) {
        pending.push({ error, context, route })
    }
}

function onWindowError(event: ErrorEvent): void {
    if (
        !event.error &&
        IGNORED_WINDOW_ERRORS.some((pattern) => pattern.test(event.message))
    ) {
        return
    }
    reportError(event.error ?? new Error(event.message || 'Script error'), {
        source: 'window',
    })
}

function onUnhandledRejection(event: PromiseRejectionEvent): void {
    reportError(event.reason, { source: 'unhandledrejection' })
}

/** Quita los oyentes y vuelve a apagarla (también para las pruebas) */
export function stopTelemetry(): void {
    window.removeEventListener('error', onWindowError)
    window.removeEventListener('unhandledrejection', onUnhandledRejection)
    state = 'off'
    reporter = null
}

export async function startTelemetry(
    config: TelemetryConfig = appConfig.telemetry
): Promise<void> {
    if (!config.enabled || state !== 'off') {
        return
    }
    state = 'loading'
    window.addEventListener('error', onWindowError)
    window.addEventListener('unhandledrejection', onUnhandledRejection)
    try {
        const { startSdk } = await import('./sdk')
        const sdk = startSdk({
            otlpUrl: config.otlpUrl,
            samplingRate: config.samplingRate,
            environment: config.environment,
            version: __APP_VERSION__,
            apiUrls: [appConfig.apiBaseUrl, appConfig.invoicingApiHost],
        })
        reporter = sdk.reportError
        state = 'on'
        for (const { error, context, route } of pending) {
            reporter(error, context, route)
        }
    } catch {
        // Sin SDK la app sigue igual: la telemetría nunca rompe una pantalla
        stopTelemetry()
    } finally {
        pending = []
    }
}
