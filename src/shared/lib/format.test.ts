import { describe, it, expect } from 'vitest'
import {
    formatCurrency,
    formatDate,
    formatDatetime,
    formatPercent,
    formatProductLabel,
} from './format'

describe('formatCurrency', () => {
    it('formats a positive number as USD with es-EC locale', () => {
        const result = formatCurrency(1234.56)
        expect(result).toContain('1')
        expect(result).toContain('234')
        expect(result).toMatch(/\$|USD/i)
    })

    it('formats zero', () => {
        expect(formatCurrency(0)).toContain('0')
    })

    it('formats negative numbers', () => {
        const result = formatCurrency(-500)
        expect(result).toContain('500')
    })

    it('matches inline definition used in views (exact locale + currency)', () => {
        const expected = new Intl.NumberFormat('es-EC', {
            style: 'currency',
            currency: 'USD',
        }).format(99.9)
        expect(formatCurrency(99.9)).toBe(expected)
    })
})

describe('formatDate', () => {
    it('formats a Date object', () => {
        const date = new Date('2024-03-15T12:00:00Z')
        const result = formatDate(date)
        expect(typeof result).toBe('string')
        expect(result.length).toBeGreaterThan(0)
    })

    it('formats an ISO string and returns a non-empty string with the year', () => {
        // Use noon UTC to avoid day-boundary shift across timezones
        const result = formatDate('2024-03-15T12:00:00Z')
        expect(typeof result).toBe('string')
        expect(result).toMatch(/2024/)
    })

    it('accepts override options', () => {
        const result = formatDate('2024-03-15', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        })
        expect(result.length).toBeGreaterThan(5)
    })
})

describe('formatDatetime', () => {
    it('returns a non-empty string for a Date', () => {
        const result = formatDatetime(new Date('2024-06-01T10:30:00Z'))
        expect(typeof result).toBe('string')
        expect(result.length).toBeGreaterThan(0)
    })

    it('returns a non-empty string for an ISO string', () => {
        const result = formatDatetime('2024-06-01T10:30:00Z')
        expect(typeof result).toBe('string')
        expect(result.length).toBeGreaterThan(0)
    })
})

describe('formatPercent', () => {
    it('defaults to 1 decimal place', () => {
        expect(formatPercent(12.5)).toBe('12.5%')
    })

    it('respects custom decimals', () => {
        expect(formatPercent(33.333, 2)).toBe('33.33%')
        expect(formatPercent(100, 0)).toBe('100%')
    })

    it('handles zero', () => {
        expect(formatPercent(0)).toBe('0.0%')
    })

    it('handles values already in percent units (not fractions)', () => {
        // 12.5 should render as "12.5%", not "1250.0%"
        expect(formatPercent(12.5)).toBe('12.5%')
    })
})

describe('formatProductLabel', () => {
    it('shows the product name and SKU', () => {
        expect(
            formatProductLabel({
                productId: 3,
                productName: 'Laptop',
                productSku: 'LAP-1',
            })
        ).toBe('Laptop (LAP-1)')
    })

    it('falls back to the id when the name is missing', () => {
        expect(formatProductLabel({ productId: 3, productName: null })).toBe(
            '#3'
        )
    })
})
