import type { Request } from 'miragejs'

/**
 * Mirage tipa cada query param como `string | string[] | null` (un parámetro
 * repetido llega como arreglo). Los handlers esperan un solo valor por clave.
 */
export const singleQueryParams = (
    request: Request
): Record<string, string | undefined> =>
    Object.fromEntries(
        Object.entries(request.queryParams).map(([key, value]) => [
            key,
            (Array.isArray(value) ? value[0] : value) ?? undefined,
        ])
    )
