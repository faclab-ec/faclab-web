import { matchRoutes } from 'react-router-dom'
import { protectedRoutes, publicRoutes } from './routes.config'

const ROUTES = [
    { path: '/' },
    ...[...protectedRoutes, ...publicRoutes].map(({ path }) => ({ path })),
]

/** Patrón de la ruta (`/sales/:id`) que la telemetría usa en vez de la URL */
export function routePattern(pathname: string): string {
    return matchRoutes(ROUTES, pathname)?.[0]?.route.path ?? 'unmatched'
}
