export function dateToIsoStartOfDay(value?: string | null): string | undefined {
    if (!value) return undefined
    return `${value}T00:00:00Z`
}
