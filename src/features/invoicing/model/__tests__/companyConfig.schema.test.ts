import { describe, it, expect } from 'vitest'
import { companyConfigSchema, nextSequenceSchema } from '../schemas'

const valid = {
    taxId: '0190000000001',
    name: 'Ferretería El Tornillo S.A.',
    tradeName: 'El Tornillo',
    mainAddress: 'Av. Loja 1-23, Cuenca',
    environment: 1 as const,
    emissionType: 1 as const,
    signingCertId: null,
    rimpeRegime: null,
}

describe('companyConfigSchema', () => {
    it('accepts a profile without establishment, emission point or sequence', () => {
        expect(companyConfigSchema.safeParse(valid).success).toBe(true)
    })

    it('accepts the RIMPE regimes', () => {
        for (const rimpeRegime of ['EMPRENDEDOR', 'NEGOCIO_POPULAR']) {
            expect(
                companyConfigSchema.safeParse({ ...valid, rimpeRegime }).success
            ).toBe(true)
        }
        expect(
            companyConfigSchema.safeParse({ ...valid, rimpeRegime: 'OTRO' })
                .success
        ).toBe(false)
    })

    it('keeps the SRI limits of names and resolutions', () => {
        expect(
            companyConfigSchema.safeParse({ ...valid, name: 'x'.repeat(65) })
                .success
        ).toBe(false)
        expect(
            companyConfigSchema.safeParse({
                ...valid,
                specialTaxpayerResolution: 'x'.repeat(33),
            }).success
        ).toBe(false)
    })
})

describe('nextSequenceSchema', () => {
    it('takes a number from 1 to 999999999', () => {
        expect(nextSequenceSchema.safeParse({ nextSequence: 42 }).success).toBe(
            true
        )
        for (const nextSequence of [0, 1_000_000_000, 1.5]) {
            expect(nextSequenceSchema.safeParse({ nextSequence }).success).toBe(
                false
            )
        }
    })
})
