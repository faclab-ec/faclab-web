/**
 * Ruta de la pantalla para la telemetría: su patrón (`/sales/:id`), nunca la
 * URL con ids, así las métricas por ruta no crecen sin límite.
 *
 * Se guarda un historial con el instante de cada cambio (`performance.now()`)
 * porque los web vitals llegan tarde: INP y CLS se informan al ocultar la
 * página y se atribuyen a la ruta donde ocurrió la interacción o el
 * desplazamiento, no a la que está abierta en ese momento.
 */

/** Atributo de spans y métricas con el patrón de la ruta */
export const ATTR_UI_ROUTE = 'faclab.ui.route'

const UNKNOWN_ROUTE = 'unknown'
const MAX_HISTORY = 100

type RouteChange = { at: number; route: string }

let history: RouteChange[] = []

export function setRoute(route: string, at = performance.now()): void {
    if (history.at(-1)?.route === route) {
        return
    }
    history.push({ at, route })
    if (history.length > MAX_HISTORY) {
        // La primera es la de carga (LCP): se conserva
        history = [history[0], ...history.slice(-(MAX_HISTORY - 1))]
    }
}

export function currentRoute(): string {
    return history.at(-1)?.route ?? UNKNOWN_ROUTE
}

/** Ruta vigente en un instante; antes del primer cambio, la de carga */
export function routeAt(time: number): string {
    let route = history[0]?.route ?? UNKNOWN_ROUTE
    for (const change of history) {
        if (change.at > time) {
            break
        }
        route = change.route
    }
    return route
}

/** Solo para pruebas */
export function resetRoutes(): void {
    history = []
}
