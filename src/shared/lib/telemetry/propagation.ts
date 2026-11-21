const escapeRegExp = (value: string) =>
    value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/** Coincide con la URL dada y todo lo que cuelga de ella */
export const urlPrefix = (url: string): RegExp =>
    new RegExp(`^${escapeRegExp(url.replace(/\/+$/, ''))}(?:[/?#]|$)`)

/**
 * Orígenes a los que fetch/XHR agregan `traceparent` y `tracestate`: solo los
 * del core y la facturación, que lo permiten en CORS y continúan la traza.
 * Ningún otro dominio lo recibe (OBSERVABILITY.md §5.1).
 */
export function traceHeaderTargets(urls: string[]): RegExp[] {
    const origins = new Set<string>()
    for (const url of urls) {
        try {
            origins.add(new URL(url, window.location.origin).origin)
        } catch {
            // Una URL mal formada no recibe el encabezado
        }
    }
    return [...origins].map(urlPrefix)
}
