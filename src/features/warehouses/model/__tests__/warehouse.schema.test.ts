import { describe, it, expect } from 'vitest'
import { warehouseSchema } from '../warehouse.schema'

describe('warehouseSchema', () => {
    it('accepts valid minimal data', () => {
        const result = warehouseSchema.safeParse({
            branchId: 1,
            name: 'Bodega Central',
            code: 'BOD-001',
        })
        expect(result.success).toBe(true)
    })

    it('accepts full valid data', () => {
        const result = warehouseSchema.safeParse({
            branchId: 1,
            name: 'Bodega Central',
            code: 'BOD-001',
            address: 'Av. Principal 123',
            city: 'Quito',
            country: 'Ecuador',
            manager: 'Juan Pérez',
            phone: '+593 99 999 9999',
            email: 'bodega@ejemplo.com',
            isActive: true,
            isDefault: false,
        })
        expect(result.success).toBe(true)
    })

    it('requires a branch', () => {
        const result = warehouseSchema.safeParse({
            branchId: 0,
            name: 'Bodega Central',
            code: 'BOD-001',
        })
        expect(result.success).toBe(false)
        expect(result.error?.issues[0].message).toBe('Sucursal requerida')
    })

    it('rejects empty name', () => {
        const result = warehouseSchema.safeParse({
            branchId: 1,
            name: '',
            code: 'BOD-001',
        })
        expect(result.success).toBe(false)
    })

    it('rejects empty code', () => {
        const result = warehouseSchema.safeParse({
            branchId: 1,
            name: 'Bodega',
            code: '',
        })
        expect(result.success).toBe(false)
    })

    it('rejects name exceeding 200 chars', () => {
        const result = warehouseSchema.safeParse({
            branchId: 1,
            name: 'a'.repeat(201),
            code: 'BOD-001',
        })
        expect(result.success).toBe(false)
    })

    it('rejects code exceeding 50 chars', () => {
        const result = warehouseSchema.safeParse({
            branchId: 1,
            name: 'Bodega',
            code: 'B'.repeat(51),
        })
        expect(result.success).toBe(false)
    })

    it('rejects invalid email', () => {
        const result = warehouseSchema.safeParse({
            branchId: 1,
            name: 'Bodega',
            code: 'BOD-001',
            email: 'not-an-email',
        })
        expect(result.success).toBe(false)
    })

    it('accepts empty string as email', () => {
        const result = warehouseSchema.safeParse({
            branchId: 1,
            name: 'Bodega',
            code: 'BOD-001',
            email: '',
        })
        expect(result.success).toBe(true)
    })

    it('accepts missing optional fields', () => {
        const result = warehouseSchema.safeParse({
            branchId: 1,
            name: 'Bodega',
            code: 'BOD-001',
        })
        expect(result.success).toBe(true)
    })
})
