import { describe, it, expect } from 'vitest'
import { locationSchema } from '../location.schema'
import { LOCATION_TYPES } from '../types'

describe('locationSchema', () => {
    const valid = {
        warehouseId: 1,
        name: 'Estante A1',
        code: 'EST-A1',
        type: 'storage' as const,
        isActive: true,
        capacity: 100,
    }

    it('accepts a valid location', () => {
        expect(locationSchema.safeParse(valid).success).toBe(true)
    })

    it('rejects missing warehouseId', () => {
        const result = locationSchema.safeParse({
            ...valid,
            warehouseId: undefined,
        })
        expect(result.success).toBe(false)
    })

    it('rejects warehouseId = 0', () => {
        const result = locationSchema.safeParse({ ...valid, warehouseId: 0 })
        expect(result.success).toBe(false)
    })

    it('rejects empty name', () => {
        const result = locationSchema.safeParse({ ...valid, name: '' })
        expect(result.success).toBe(false)
    })

    it('rejects empty code', () => {
        const result = locationSchema.safeParse({ ...valid, code: '' })
        expect(result.success).toBe(false)
    })

    it('rejects invalid type', () => {
        const result = locationSchema.safeParse({ ...valid, type: 'INVALID' })
        expect(result.success).toBe(false)
    })

    it('accepts all valid location types', () => {
        for (const type of LOCATION_TYPES) {
            expect(locationSchema.safeParse({ ...valid, type }).success).toBe(
                true
            )
        }
    })

    it('accepts null capacity', () => {
        const result = locationSchema.safeParse({ ...valid, capacity: null })
        expect(result.success).toBe(true)
    })

    it('accepts undefined optional fields', () => {
        const { isActive: _a, capacity: _b, ...minimal } = valid
        expect(locationSchema.safeParse(minimal).success).toBe(true)
    })

    it('rejects negative capacity', () => {
        const result = locationSchema.safeParse({ ...valid, capacity: -1 })
        expect(result.success).toBe(false)
    })
})
