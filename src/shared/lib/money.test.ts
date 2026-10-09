import { describe, it, expect } from 'vitest'
import { roundMoney } from './money'

describe('roundMoney', () => {
    it('rounds half a cent up', () => {
        expect(roundMoney(0.0675)).toBe(0.07)
        expect(roundMoney(0.125)).toBe(0.13)
    })

    it('ignores binary floating point error', () => {
        expect(roundMoney(1.005)).toBe(1.01)
        expect(roundMoney(2.675)).toBe(2.68)
        expect(roundMoney(0.1 + 0.2)).toBe(0.3)
    })

    it('keeps whole cents unchanged', () => {
        expect(roundMoney(20.7)).toBe(20.7)
        expect(roundMoney(0)).toBe(0)
    })
})
