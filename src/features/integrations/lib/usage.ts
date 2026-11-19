import type { IntegrationUsageDay } from '../model/types'

/** Días que muestra el portal: los mismos que el core da por defecto */
export const USAGE_DAYS = 30

const pad = (n: number) => String(n).padStart(2, '0')

/** YYYY-MM-DD del día local */
export const isoDay = (date: Date): string =>
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`

const shift = (day: string, days: number): string => {
    const [y, m, d] = day.split('-').map(Number)
    return isoDay(new Date(y, m - 1, d + days))
}

const emptyDay = (day: string): IntegrationUsageDay => ({
    day,
    tokenRequests: 0,
    tokenFailures: 0,
    requests: 0,
    errors: 0,
    lastIp: null,
    lastSeenAt: null,
})

/**
 * Los últimos `USAGE_DAYS` días, del más reciente al más antiguo, con ceros
 * en los que el core no trae (solo envía los días con actividad). El último
 * día es hoy o el último que trae el core, si su reloj ya pasó la medianoche.
 */
export function usageWindow(
    rows: IntegrationUsageDay[],
    today: Date = new Date()
): IntegrationUsageDay[] {
    const byDay = new Map(rows.map((row) => [row.day, row]))
    const last = rows.reduce(
        (max, row) => (row.day > max ? row.day : max),
        isoDay(today)
    )
    return Array.from({ length: USAGE_DAYS }, (_, i) => {
        const day = shift(last, -i)
        return byDay.get(day) ?? emptyDay(day)
    })
}

export interface UsageTotals {
    tokenRequests: number
    tokenFailures: number
    requests: number
    errors: number
}

export const usageTotals = (rows: IntegrationUsageDay[]): UsageTotals =>
    rows.reduce(
        (totals, row) => ({
            tokenRequests: totals.tokenRequests + row.tokenRequests,
            tokenFailures: totals.tokenFailures + row.tokenFailures,
            requests: totals.requests + row.requests,
            errors: totals.errors + row.errors,
        }),
        { tokenRequests: 0, tokenFailures: 0, requests: 0, errors: 0 }
    )
