import { describe, expect, it } from 'vitest'
import {
    daysLeft,
    limitLabel,
    periodLabel,
    subscriptionNotice,
    usagePercent,
    usageTone,
    type SubscriptionSummary,
} from '../types'

const NOW = new Date('2026-11-24T12:00:00Z')

const active: SubscriptionSummary = {
    planName: 'Básico',
    status: 'active',
    trialEndsAt: null,
    readOnly: false,
    documentsLimitReached: false,
}

describe('usage', () => {
    it('measures what part of the limit is used', () => {
        expect(usagePercent(1, 4)).toBe(25)
        expect(usagePercent(5, 4)).toBe(100)
        expect(usagePercent(3, null)).toBe(0)
        expect(usagePercent(1, 0)).toBe(100)
    })

    it('warns near the limit and alarms at it', () => {
        expect(usageTone(1, 10)).toBe('success')
        expect(usageTone(8, 10)).toBe('warning')
        expect(usageTone(10, 10)).toBe('danger')
        // Above it after a smaller plan
        expect(usageTone(12, 10)).toBe('danger')
        expect(usageTone(99, null)).toBe('neutral')
    })

    it('names a limit or its absence', () => {
        expect(limitLabel(null)).toBe('Sin límite')
        expect(limitLabel(2000)).toBe('2.000')
    })

    it('names a month', () => {
        expect(periodLabel('2026-11-01')).toBe('noviembre de 2026')
    })

    it('counts the days left of a trial', () => {
        expect(daysLeft('2026-11-27T12:00:00Z', NOW)).toBe(3)
        expect(daysLeft('2026-11-24T18:00:00Z', NOW)).toBe(1)
    })
})

describe('subscriptionNotice', () => {
    it('says nothing of an active company within its plan', () => {
        expect(subscriptionNotice(active, NOW)).toBeNull()
        expect(subscriptionNotice(undefined, NOW)).toBeNull()
    })

    it.each([
        ['suspended', 'La suscripción está suspendida'],
        ['cancelled', 'La suscripción está cancelada'],
        ['trial', 'El período de prueba terminó'],
    ] as const)('a %s company can only read', (status, reason) => {
        const notice = subscriptionNotice(
            { ...active, status, readOnly: true },
            NOW
        )

        expect(notice?.type).toBe('danger')
        expect(notice?.title).toBe(`${reason}: la empresa solo puede consultar`)
        expect(notice?.message).toContain('se siguen emitiendo')
    })

    it('warns a week before the trial ends', () => {
        const trial = (trialEndsAt: string) =>
            subscriptionNotice({ ...active, status: 'trial', trialEndsAt }, NOW)

        expect(trial('2026-12-20T12:00:00Z')).toBeNull()
        expect(trial('2026-11-29T12:00:00Z')?.title).toBe(
            'El período de prueba termina en 5 días'
        )
        expect(trial('2026-11-24T20:00:00Z')?.title).toBe(
            'El período de prueba termina hoy'
        )
    })

    it('warns when the documents of the month reached the plan', () => {
        const notice = subscriptionNotice(
            { ...active, documentsLimitReached: true },
            NOW
        )

        expect(notice?.type).toBe('warning')
        expect(notice?.message).toContain('se siguen emitiendo')
    })
})
