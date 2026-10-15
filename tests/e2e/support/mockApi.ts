import type { Page, Route } from '@playwright/test'

/**
 * API simulada para las pruebas E2E.
 *
 * Intercepta todo lo que la app pide a faclab-core (`/api/**`) y a
 * faclab-invoicing (`/__invoicing/**`) y responde con el mismo envelope
 * `{ data, meta }` / `{ errors, meta }` de los backends reales.
 *
 * Una llamada sin handler registrado NO se deja pasar: se anota en
 * `unhandled` y la prueba falla al terminar (ver `support/test.ts`).
 */

export type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

export interface MockRequest {
    method: Method
    path: string
    query: URLSearchParams
    params: Record<string, string>
    body: unknown
    /** Cabeceras que envió el navegador, incluida `cookie`. */
    headers: Record<string, string>
}

export interface MockResponse {
    status: number
    body?: unknown
    /** P. ej. `set-cookie`, para simular la cookie del refresh token. */
    headers?: Record<string, string>
}

export type Handler = (
    request: MockRequest
) => MockResponse | Promise<MockResponse>

interface RouteEntry {
    method: Method
    pattern: RegExp
    paramNames: string[]
    handler: Handler
}

export const CORE = '/api'
export const ADMIN = '/api/admin'
export const AUTH = '/api/auth'
export const POS = '/api/pos'
export const INVOICING = '/__invoicing/api'

const FIXED_TIMESTAMP = '2026-01-15T15:00:00.000Z'

const meta = () => ({ requestId: 'e2e-request', timestamp: FIXED_TIMESTAMP })

// --- Respuestas con el envelope del backend ---

export const ok = <T>(data: T, status = 200): MockResponse => ({
    status,
    body: { data, meta: meta() },
})

export const created = <T>(data: T): MockResponse => ok(data, 201)

export const noContent = (): MockResponse => ({ status: 204 })

/** Lista paginada a partir de `limit` y `offset` de la consulta. */
export const paginated = <T>(
    items: T[],
    query: URLSearchParams
): MockResponse => {
    const limit = Number(query.get('limit') ?? 10)
    const offset = Number(query.get('offset') ?? 0)

    return {
        status: 200,
        body: {
            data: items.slice(offset, offset + limit),
            meta: {
                ...meta(),
                pagination: { total: items.length, limit, offset },
            },
        },
    }
}

export const apiError = (
    status: number,
    code: string,
    message: string,
    field?: string
): MockResponse => ({
    status,
    body: { errors: [{ code, message, field }], meta: meta() },
})

const isApiPath = (pathname: string) =>
    pathname.startsWith(`${CORE}/`) || pathname.startsWith('/__invoicing/')

const compile = (path: string) => {
    const paramNames: string[] = []
    const source = path
        .split('/')
        .map((segment) => {
            if (segment.startsWith(':')) {
                paramNames.push(segment.slice(1))
                return '([^/]+)'
            }
            return segment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        })
        .join('/')

    return { pattern: new RegExp(`^${source}$`), paramNames }
}

const parseBody = (raw: string | null): unknown => {
    if (!raw) return undefined
    try {
        return JSON.parse(raw)
    } catch {
        return raw
    }
}

export class MockApi {
    /** Todas las llamadas recibidas, en orden. */
    readonly calls: MockRequest[] = []
    /** Llamadas sin handler: deben quedar vacías al terminar la prueba. */
    readonly unhandled: string[] = []
    /** URLs a las que un handler respondió con error a propósito. */
    readonly failedOnPurpose = new Set<string>()

    private readonly routes: RouteEntry[] = []

    static async attach(page: Page): Promise<MockApi> {
        const api = new MockApi()
        await page.route(
            (url) => isApiPath(url.pathname),
            (route) => api.dispatch(route)
        )
        return api
    }

    /** El último handler registrado para un método y ruta es el que gana. */
    on(method: Method, path: string, handler: Handler): this {
        this.routes.unshift({ method, handler, ...compile(path) })
        return this
    }

    get(path: string, handler: Handler): this {
        return this.on('GET', path, handler)
    }

    post(path: string, handler: Handler): this {
        return this.on('POST', path, handler)
    }

    put(path: string, handler: Handler): this {
        return this.on('PUT', path, handler)
    }

    patch(path: string, handler: Handler): this {
        return this.on('PATCH', path, handler)
    }

    delete(path: string, handler: Handler): this {
        return this.on('DELETE', path, handler)
    }

    callsTo(method: Method, path: string): MockRequest[] {
        const { pattern } = compile(path)
        return this.calls.filter(
            (call) => call.method === method && pattern.test(call.path)
        )
    }

    private async dispatch(route: Route): Promise<void> {
        const request = route.request()
        const url = new URL(request.url())
        const method = request.method() as Method

        const entry = this.routes.find(
            (candidate) =>
                candidate.method === method &&
                candidate.pattern.test(url.pathname)
        )

        if (!entry) {
            this.unhandled.push(`${method} ${url.pathname}${url.search}`)
            await this.fulfill(
                route,
                apiError(
                    501,
                    'E2E_UNMOCKED',
                    `Sin handler en la API simulada: ${method} ${url.pathname}`
                )
            )
            return
        }

        const match = entry.pattern.exec(url.pathname) ?? []
        const params = Object.fromEntries(
            entry.paramNames.map((name, index) => [name, match[index + 1]])
        )
        const mockRequest: MockRequest = {
            method,
            path: url.pathname,
            query: url.searchParams,
            params,
            body: parseBody(request.postData()),
            headers: await request.allHeaders(),
        }
        this.calls.push(mockRequest)

        const response = await entry.handler(mockRequest)
        if (response.status >= 400) {
            this.failedOnPurpose.add(request.url())
        }
        await this.fulfill(route, response)
    }

    private async fulfill(route: Route, response: MockResponse): Promise<void> {
        if (response.body === undefined) {
            await route.fulfill({
                status: response.status,
                headers: response.headers,
            })
            return
        }
        await route.fulfill({
            status: response.status,
            headers: response.headers,
            contentType: 'application/json',
            body: JSON.stringify(response.body),
        })
    }
}
