import { describe, it, expect, beforeEach } from 'vitest'
import sessionHint from '../sessionHint'

describe('sessionHint', () => {
    beforeEach(() => localStorage.clear())

    it('marks, reads and clears the session flag', () => {
        expect(sessionHint.has()).toBe(false)
        sessionHint.mark()
        expect(sessionHint.has()).toBe(true)
        sessionHint.clear()
        expect(sessionHint.has()).toBe(false)
    })

    it('removes the tokens that older versions left in localStorage', () => {
        localStorage.setItem('fc.access', 'old-access')
        localStorage.setItem('fc.refresh', 'old-refresh')
        localStorage.setItem('fc.accessExpiresAt', '1')
        localStorage.setItem('theme-storage', '{}')

        sessionHint.purgeLegacyTokens()

        expect(Object.keys(localStorage)).toEqual(['theme-storage'])
    })
})
