import { describe, it, expect } from 'vitest'
import {
    branchSchema,
    emissionPointSchema,
    posTerminalSchema,
} from '../schemas'

describe('branchSchema', () => {
    const valid = {
        establishmentCode: '002',
        name: 'Sucursal Norte',
        address: '',
        isActive: true,
    }

    it('accepts an SRI establishment code from 001 to 999', () => {
        expect(branchSchema.safeParse(valid).success).toBe(true)
        expect(
            branchSchema.safeParse({ ...valid, establishmentCode: '999' })
                .success
        ).toBe(true)
    })

    it('rejects 000 and codes that are not three digits', () => {
        for (const establishmentCode of ['000', '1', '0001', 'A01', '']) {
            expect(
                branchSchema.safeParse({ ...valid, establishmentCode }).success
            ).toBe(false)
        }
    })

    it('requires a name and limits the address', () => {
        expect(branchSchema.safeParse({ ...valid, name: ' ' }).success).toBe(
            false
        )
        expect(
            branchSchema.safeParse({ ...valid, address: 'x'.repeat(301) })
                .success
        ).toBe(false)
    })
})

describe('emissionPointSchema', () => {
    it('uses the same SRI code rule, with an optional name', () => {
        expect(
            emissionPointSchema.safeParse({
                code: '001',
                name: '',
                isActive: true,
            }).success
        ).toBe(true)
        expect(
            emissionPointSchema.safeParse({
                code: '000',
                name: '',
                isActive: true,
            }).success
        ).toBe(false)
    })
})

describe('posTerminalSchema', () => {
    const valid = {
        code: 'CAJA-02',
        name: 'Caja 2',
        emissionPointId: 3,
        defaultLocationId: 7,
        isActive: true,
    }

    it('accepts a complete terminal', () => {
        expect(posTerminalSchema.safeParse(valid).success).toBe(true)
    })

    it('requires an emission point and a stock location', () => {
        const result = posTerminalSchema.safeParse({
            ...valid,
            emissionPointId: 0,
            defaultLocationId: 0,
        })
        expect(result.success).toBe(false)
        expect(result.error?.issues.map((i) => i.message)).toEqual([
            'Punto de emisión requerido',
            'Ubicación requerida',
        ])
    })
})
