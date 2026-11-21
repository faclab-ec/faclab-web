export type AppConfig = {
    apiPrefix: string
    apiBaseUrl: string
    authApiHost: string
    adminUsersApiHost: string
    authenticatedEntryPath: string
    unAuthenticatedEntryPath: string
    tourPath: string
    locale: string
    enableMock: boolean
    inventoryApiHost: string
    posApiHost: string
    invoicingApiHost: string
    telemetry: TelemetryConfig
}

/** Trazas, errores y web vitals hacia el Collector (S7.3, OBSERVABILITY.md §9.3) */
export type TelemetryConfig = {
    /** Apagada por defecto: sin endpoint no se envía nada (rollback) */
    enabled: boolean
    /** Base OTLP/HTTP; `/otlp` es el mismo origen (proxy de Vite o Caddy) */
    otlpUrl: string
    /** Fracción de trazas que inicia el navegador; el core y la facturación la respetan */
    samplingRate: number
    /** `deployment.environment.name`: local, staging o production */
    environment: string
}

/**
 * URLs y telemetría que el contenedor escribe en `/config.js` al arrancar
 * (`docker/entrypoint.sh`), para cambiarlas sin reconstruir la imagen. Ese
 * script corre antes del bundle; en desarrollo `public/config.js` lo deja
 * vacío y mandan los `VITE_*`.
 */
const runtimeConfig: FaclabRuntimeConfig =
    (typeof window !== 'undefined' && window.__FACLAB_CONFIG__) || {}

const apiBaseUrl =
    runtimeConfig.apiBaseUrl ||
    ((import.meta.env.VITE_API_BASE_URL as string | undefined) ??
        'http://localhost:3000')

const invoicingApiUrl =
    runtimeConfig.invoicingApiUrl ||
    ((import.meta.env.VITE_INVOICING_API_URL as string | undefined) ??
        'http://localhost:3173')

const env = import.meta.env as Record<string, string | undefined>

const samplingRate = (value: number | string | undefined): number => {
    const rate = Number(value ?? 1)
    return Number.isFinite(rate) ? Math.min(Math.max(rate, 0), 1) : 1
}

const telemetry: TelemetryConfig = {
    enabled: runtimeConfig.otelEnabled ?? env.VITE_OTEL_ENABLED === 'true',
    otlpUrl: (runtimeConfig.otlpUrl || env.VITE_OTLP_URL || '/otlp').replace(
        /\/+$/,
        ''
    ),
    samplingRate: samplingRate(
        runtimeConfig.otelSamplingRate ?? env.VITE_OTEL_SAMPLING_RATE
    ),
    environment: runtimeConfig.environment || env.VITE_ENVIRONMENT || 'local',
}

const appConfig: AppConfig = {
    apiPrefix: '',
    apiBaseUrl,
    authApiHost: `${apiBaseUrl}/api/auth`,
    adminUsersApiHost: `${apiBaseUrl}/api/admin/users`,
    authenticatedEntryPath: '/home',
    unAuthenticatedEntryPath: '/sign-in',
    tourPath: '/',
    locale: 'es',
    enableMock: false,
    inventoryApiHost: `${apiBaseUrl}/api/admin`,
    posApiHost: `${apiBaseUrl}/api/pos`,
    invoicingApiHost: invoicingApiUrl,
    telemetry,
}

export default appConfig
