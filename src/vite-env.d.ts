/// <reference types="vite/client" />

/** Lo que `/config.js` define al arrancar el contenedor (ver `app.config.ts`). */
interface FaclabRuntimeConfig {
    apiBaseUrl?: string
    invoicingApiUrl?: string
    otelEnabled?: boolean
    otlpUrl?: string
    otelSamplingRate?: number
    environment?: string
}

interface Window {
    __FACLAB_CONFIG__?: FaclabRuntimeConfig
}

/** Versión de la app (`SERVICE_VERSION` del build, o la de package.json) */
declare const __APP_VERSION__: string
