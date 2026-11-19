import { describe, expect, it } from 'vitest'
import { USAGE_DAYS, usageTotals, usageWindow } from '../usage'
import type { IntegrationUsageDay } from '../../model/types'

const day = (
    value: string,
    overrides: Partial<IntegrationUsageDay> = {}
): IntegrationUsageDay => ({
    day: value,
    tokenRequests: 1,
    tokenFailures: 0,
    requests: 10,
    errors: 1,
    lastIp: '203.0.113.7',
    lastSeenAt: `${value}T15:00:00Z`,
    ...overrides,
})

describe('usageWindow', () => {
    it('fills the days without activity, newest first', () => {
        const window = usageWindow(
            [day('2026-11-16'), day('2026-11-18')],
            new Date(2026, 10, 18, 10)
        )
        expect(window).toHaveLength(USAGE_DAYS)
        expect(window.slice(0, 3).map((d) => [d.day, d.requests])).toEqual([
            ['2026-11-18', 10],
            ['2026-11-17', 0],
            ['2026-11-16', 10],
        ])
        expect(window.at(-1)?.day).toBe('2026-10-20')
    })

    it('ends on the core day when its clock is past midnight', () => {
        // 21:00 en Ecuador ya es el día siguiente en UTC
        const window = usageWindow(
            [day('2026-11-19')],
            new Date(2026, 10, 18, 21)
        )
        expect(window[0].day).toBe('2026-11-19')
    })

    it('crosses months and years', () => {
        const window = usageWindow([], new Date(2026, 0, 3))
        expect(window.slice(2, 4).map((d) => d.day)).toEqual([
            '2026-01-01',
            '2025-12-31',
        ])
    })
})

describe('usageTotals', () => {
    it('adds up the window', () => {
        expect(
            usageTotals([day('2026-11-17'), day('2026-11-18', { errors: 4 })])
        ).toEqual({
            tokenRequests: 2,
            tokenFailures: 0,
            requests: 20,
            errors: 5,
        })
    })
})
