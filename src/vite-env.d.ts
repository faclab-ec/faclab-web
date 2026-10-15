/// <reference types="vite/client" />

/** Lo que `/config.js` define al arrancar el contenedor (ver `app.config.ts`). */
interface FaclabRuntimeConfig {
    apiBaseUrl?: string
    invoicingApiUrl?: string
}

interface Window {
    __FACLAB_CONFIG__?: FaclabRuntimeConfig
}
