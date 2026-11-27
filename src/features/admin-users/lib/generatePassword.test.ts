import { afterEach, describe, expect, it, vi } from 'vitest'

import generatePassword from './generatePassword'

describe('generatePassword', () => {
    afterEach(() => vi.restoreAllMocks())

    it('gives 12 characters of its alphabet', () => {
        const password = generatePassword()

        expect(password).toHaveLength(12)
        expect(password).toMatch(/^[A-HJKMNP-Za-hjkmnp-z2-9!@#%]{12}$/)
    })

    it('draws again the bytes that would favour some characters (S9.3)', () => {
        // 232 is the largest multiple of the 58 characters: 232..255 are skipped
        const bytes = [
            [255, 240, 232, 0, 57, 1, 2, 3, 4, 5, 6, 7],
            [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19],
        ]
        vi.spyOn(crypto, 'getRandomValues').mockImplementation(((
            array: Uint8Array
        ) => {
            array.set(bytes.shift()!)
            return array
        }) as typeof crypto.getRandomValues)

        expect(generatePassword()).toBe('A%BCDEFGHJKM')
    })
})
